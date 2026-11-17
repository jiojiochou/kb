import {
  BadRequestException,
  HttpException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto.js';
import { QueryUsersDto } from './dto/query-users.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { SnowflakeIdService } from '@street-devs/nest-snowflake-id';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';
import { RsaService } from '@app/rsa';

/** bcrypt 计算成本，每加 1 哈希耗时翻倍；12 是当前常用的安全与性能折中值。 */
const PASSWORD_SALT_ROUNDS = 12;
const PASSWORD_MIN_LENGTH = 8;
/** bcrypt 只使用前 72 字节，超出部分会被静默截断，因此按 UTF-8 字节限制（中文占 3 字节）。 */
const PASSWORD_MAX_BYTES = 72;

@Injectable()
export class UserService {
  constructor(
    private readonly snowflakeIdService: SnowflakeIdService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly rsaService: RsaService,
  ) {}

  /**
   * 解密前端用 RSA 公钥加密的密码，并校验明文长度。
   * 密文无法解密通常是前端仍在使用重新生成前的旧公钥，提示重新获取公钥。
   */
  private decryptPassword(encryptedPassword: string): string {
    let password: string;
    try {
      password = this.rsaService.decryptPassword(encryptedPassword);
    } catch (e) {
      if (e instanceof HttpException) {
        throw new BadRequestException('密码解密失败，请重新获取公钥后重试');
      }
      throw e;
    }

    if ([...password].length < PASSWORD_MIN_LENGTH) {
      throw new BadRequestException(
        `密码不能少于 ${PASSWORD_MIN_LENGTH} 个字符`,
      );
    }
    if (Buffer.byteLength(password) > PASSWORD_MAX_BYTES) {
      throw new BadRequestException(`密码不能超过 ${PASSWORD_MAX_BYTES} 字节`);
    }
    return password;
  }

  async registerUser(registerUserDto: RegisterUserDto) {
    const {
      account,
      email,
      password: encryptedPassword,
      ...remainder
    } = registerUserDto;
    // 先解密并校验密码，格式错误的请求不访问数据库。
    const password = this.decryptPassword(encryptedPassword);
    /**
     * 使用existsBy
     */
    // const [accountExists, emailExists] = await Promise.all([
    //   this.userRepository.existsBy({ account }),
    //   this.userRepository.existsBy({ email }),
    // ]);

    /**
     * 使用find
     * 找account===RegisterUserDto.account || email === RegisterUserDto.email
     */
    const findUsers = await this.userRepository.find({
      // 软删除后仍保留账号和邮箱，查重范围与数据库唯一约束一致。
      withDeleted: true,
      select: {
        account: true,
        email: true,
      },
      where: [{ account }, { email }],
    });

    const accountExists = findUsers.find((f) => f.account === account);
    /**
     * email在postgre中是'citext'类型不区分大小写
     * js===是严格比较区分大小写
     */
    const emailExists = findUsers.find((f) => f.email.toLowerCase() === email);

    if (accountExists) {
      throw new ConflictException('账号已被注册');
    }
    if (emailExists) {
      throw new ConflictException('邮箱已被注册');
    }

    // 查重通过后再哈希，避免为必然失败的注册消耗 bcrypt 计算；数据库只保存哈希值。
    const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

    const userData = this.userRepository.create({
      id: this.snowflakeIdService.generate().toString(),
      account,
      email,
      password: passwordHash,
      ...remainder,
    });

    try {
      const user = await this.userRepository.save(userData);
      const { password: _, ...result } = user;
      return result;
    } catch (e) {
      if (e instanceof QueryFailedError) {
        const { code, constraint } = e.driverError as {
          code?: string;
          constraint?: string;
        };
        // 23505: unique_violation,并发注册时查重已通过但插入撞上唯一索引
        if (code === '23505') {
          if (constraint === 'uq_user_account') {
            throw new ConflictException('账号已被注册');
          }
          if (constraint === 'uq_user_email') {
            throw new ConflictException('邮箱已被注册');
          }
        }
      }
      throw new InternalServerErrorException();
    }
  }

  /** 查询有效用户的指定页，可按账号筛选；超过末页时返回空列表，仍保留实际总数。 */
  async findUsers({ page, pageSize, account }: QueryUsersDto) {
    const skip = (page - 1) * pageSize;
    // 页码和每页条数分别合法时，乘积仍可能超出安全整数范围。
    if (!Number.isSafeInteger(skip)) {
      throw new BadRequestException('分页偏移量超出有效范围');
    }

    // TypeORM 默认排除软删除用户；列表和总数使用相同的有效用户范围。
    const [items, total] = await this.userRepository.findAndCount({
      // 显式选择对外资料，避免把密码等内部字段带入列表响应。
      select: {
        id: true,
        account: true,
        email: true,
        displayName: true,
        firstName: true,
        lastName: true,
        avatar: true,
        lastLoginTime: true,
        createTime: true,
        updateTime: true,
      },
      where: account ? { account } : {},
      // 创建时间相同时用唯一 ID 排序，保持翻页顺序确定。
      order: { createTime: 'DESC', id: 'DESC' },
      skip,
      take: pageSize,
    });

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findUserById(id: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ id });
  }

  async findUserByAccount(account: string): Promise<User | null> {
    const normalizedAccount = account?.trim();
    if (!normalizedAccount) {
      throw new BadRequestException('account不能为空');
    }
    return await this.userRepository.findOneBy({ account: normalizedAccount });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email?.trim();
    if (!normalizedEmail) {
      throw new BadRequestException('email不能为空');
    }
    return await this.userRepository.findOneBy({ email: normalizedEmail });
  }

  /** 按 ID 更新有效用户资料；邮箱唯一性由数据库约束保证，包含已删除账户。 */
  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    return await this.updateUserBy(
      { id },
      updateUserDto,
      '用户不存在或已被删除',
    );
  }

  /** 按账号更新有效用户资料；账号去除首尾空格，空账号返回 400。 */
  async updateUserByAccount(account: string, updateUserDto: UpdateUserDto) {
    const normalizedAccount = account?.trim();
    if (!normalizedAccount) {
      throw new BadRequestException('account不能为空');
    }
    return await this.updateUserBy(
      { account: normalizedAccount },
      updateUserDto,
      '账号不存在或已被删除',
    );
  }

  /** 按 ID 或账号定位用户后执行部分更新，两种入口共用字段过滤和错误转换。 */
  private async updateUserBy(
    criteria: { id: string } | { account: string },
    updateUserDto: UpdateUserDto,
    notFoundMessage: string,
  ) {
    // 只提取允许修改的字段；undefined 保留原值，null 用于清空可空资料。
    const changes: UpdateUserDto = {};
    for (const field of [
      'email',
      'displayName',
      'firstName',
      'lastName',
      'avatar',
    ] as const) {
      const value = updateUserDto[field];
      if (value !== undefined) {
        Object.assign(changes, { [field]: value });
      }
    }
    if (Object.keys(changes).length === 0) {
      throw new BadRequestException('至少提供一个需要更新的字段');
    }

    try {
      // 只写入本次提交的字段，避免覆盖其他资料；同时排除已软删除账户。
      const updated = await this.userRepository.update(
        { ...criteria, deleteTime: IsNull() },
        changes,
      );
      if (!updated.affected) {
        throw new NotFoundException(notFoundMessage);
      }
    } catch (e) {
      if (e instanceof NotFoundException) {
        throw e;
      }
      if (e instanceof QueryFailedError) {
        const { code, constraint } = e.driverError as {
          code?: string;
          constraint?: string;
        };
        // 将邮箱唯一约束冲突（包括并发更新）转换为业务上的邮箱占用提示。
        if (code === '23505' && constraint === 'uq_user_email') {
          throw new ConflictException('邮箱已被注册');
        }
      }
      throw new InternalServerErrorException();
    }

    // 重新读取数据库中的资料和自动更新的时间；若此时已被删除，则返回 404。
    const user = await this.userRepository.findOneBy(criteria);
    if (!user) {
      throw new NotFoundException(notFoundMessage);
    }
    // 对外响应不包含密码及软删除标记。
    const { password: _, deleteTime: __, ...result } = user;
    return result;
  }

  async softDeleteUserById(id: string): Promise<void> {
    const result = await this.userRepository.softDelete({
      id,
      deleteTime: IsNull(),
    });
    if (!result.affected) {
      throw new NotFoundException('用户不存在或已被删除');
    }
  }

  async softDeleteUserByAccount(account: string): Promise<void> {
    const normalizedAccount = account?.trim();
    if (!normalizedAccount) {
      throw new BadRequestException('account不能为空');
    }

    const result = await this.userRepository.softDelete({
      account: normalizedAccount,
      deleteTime: IsNull(),
    });
    if (!result.affected) {
      throw new NotFoundException('账号不存在或已被删除');
    }
  }

  /**
   * 按 ID 硬删除用户，从数据库中物理移除记录，不可恢复。
   * 与软删除不同，已软删除的用户同样可以被硬删除；删除后账号和邮箱可重新注册。
   */
  async hardDeleteUserById(id: string): Promise<void> {
    // Repository.delete 不附加 deleteTime 条件，会同时匹配有效和已软删除的记录。
    const result = await this.userRepository.delete({ id });
    if (!result.affected) {
      throw new NotFoundException('用户不存在');
    }
  }

  /** 按账号硬删除用户（含已软删除账户）；账号去除首尾空格，空账号返回 400。 */
  async hardDeleteUserByAccount(account: string): Promise<void> {
    const normalizedAccount = account?.trim();
    if (!normalizedAccount) {
      throw new BadRequestException('account不能为空');
    }

    const result = await this.userRepository.delete({
      account: normalizedAccount,
    });
    if (!result.affected) {
      throw new NotFoundException('账号不存在');
    }
  }

  async isAccountTaken(account: string) {
    if (!account) {
      throw new BadRequestException('account不能为空');
    }
    return await this.userRepository.exists({
      where: { account },
      withDeleted: true,
    });
  }
}
