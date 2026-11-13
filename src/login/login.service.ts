import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class LoginService {
  constructor(private readonly userService: UserService) {}

  async login(_loginDto: LoginDto) {}
}
