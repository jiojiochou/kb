import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { SnowflakeIdService } from '@street-devs/nest-snowflake-id';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
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
     */
    const findUsers = await this.userRepository.find({
      select: {
        account: true,
        email: true,
      },
      where: [{ account }, { email }],
    });

    const accountExists = findUsers.find((f) => f.account === account);
    const emailExists = findUsers.find((f) => f.email === email);

    if (accountExists) {
      throw new ConflictException('账号已存在');
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
    } catch {
      throw new InternalServerErrorException();
    }
  }
}
