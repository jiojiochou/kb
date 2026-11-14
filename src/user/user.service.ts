import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto.js';
import { QueryUsersDto } from './dto/query-users.dto.js';
import { SnowflakeIdService } from '@street-devs/nest-snowflake-id';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserService {
  constructor(
    private readonly snowflakeIdService: SnowflakeIdService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async registerUser(registerUserDto: RegisterUserDto) {
    const { account, email, password, ...remainder } = registerUserDto;
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

    const userData = this.userRepository.create({
      id: this.snowflakeIdService.generate().toString(),
      account,
      email,
      password,
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

  async findUsers({ page, pageSize }: QueryUsersDto) {
    const skip = (page - 1) * pageSize;
    if (!Number.isSafeInteger(skip)) {
      throw new BadRequestException('分页偏移量超出有效范围');
    }

    const [items, total] = await this.userRepository.findAndCount({
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
