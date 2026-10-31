import { BadRequestException, Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterType, User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LoginService {
  @InjectRepository(User)
  private readonly userRepository: Repository<User>;

  async login(loginDto: LoginDto) {
    // 1. 用户邮箱密码登录
    // 2. 用户账号密码登录
  }
}
