import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class LoginService {
  constructor(private readonly userService: UserService) {}

  async login(loginDto: LoginDto) {}
}
