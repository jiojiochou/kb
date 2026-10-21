import { BadRequestException, Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
// import Redis from 'ioredis';

@Injectable()
export class LoginService {
  @InjectRepository(User)
  private readonly userRepository: Repository<User>;

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOneBy({
      account: loginDto.account,
    });

    if (!user) {
      throw new BadRequestException('没有找到');
    }

    if (loginDto.password !== user.password) {
      throw new BadRequestException('账号或密码错误');
    }

    const { password, ...reset } = user;

    return reset;
  }
}
