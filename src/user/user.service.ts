import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SnowflakeIdService } from '@street-devs/nest-snowflake-id';
import { CreateUserDto } from './dto/create.dto';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly snowflakeIdService: SnowflakeIdService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    const user = this.userRepository.create({
      id: this.snowflakeIdService.generate().toString(),
      account: createUserDto.account,
      password: createUserDto.password,
      email: createUserDto.email,
      name: createUserDto.name,
    });

    try {
      const savedUser = await this.userRepository.save(user);
      const { password: _, ...result } = savedUser;
      return result;
    } catch (error) {
      // 23505 是 PostgreSQL 的唯一约束冲突错误码。
      /**
       * TODO:
       * 把postgre的报错情况弄成枚举
       * Enum postgreError {
       *    notUnique: "23505",
       *    ...
       * }
       */
      if (
        error instanceof QueryFailedError &&
        error.driverError.code === '23505'
      ) {
        throw new ConflictException('账号或邮箱已存在');
      }

      throw error;
    }
  }

  findOne() {}
}
