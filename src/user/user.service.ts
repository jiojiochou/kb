import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SnowflakeIdService } from '@street-devs/nest-snowflake-id';
import { CreateUserDto } from './dto/create.dto';
import { QueryFailedError, Repository } from 'typeorm';
import { RegisterType, User } from './entities/user.entity';
import { type GoogleInfo } from 'src/login/google.strategy';
import { Profile } from 'passport-github2';

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
      registerType: RegisterType.normal,
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

  async findGoogleUserByEmail(email: string) {
    return await this.userRepository.findOneBy({
      registerType: RegisterType.google,
      email,
    });
  }

  async registerByGoogle(info: GoogleInfo) {
    const user = this.userRepository.create({
      id: info.id,
      email: info.email,
      account: info.email,
      name: info.displayName,
      firstName: info.firstName,
      lastName: info.lastName,
      avatar: info.picture,
      registerType: RegisterType.google,
    });

    return await this.userRepository.save(user);
  }

  async findUserByGithubId(profile: Profile) {
    return await this.userRepository.findOneBy({
      id: profile.id,
      registerType: RegisterType.github,
    });
  }

  async registerByGithub(info: Profile) {
    const user = this.userRepository.create({
      id: info.id,
      name: info.displayName,
      avatar: info.photos[0].value,
      registerType: RegisterType.github,
    });

    return await this.userRepository.save(user);
  }
}
