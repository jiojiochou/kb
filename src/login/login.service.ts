import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class LoginService {
  constructor(private readonly userService: UserService) {}

  async login(loginDto: LoginDto) {
    const identity = await this.userService.findPasswordIdentity(
      loginDto.account,
    );

    if (
      !identity?.passwordHash ||
      !(await bcrypt.compare(loginDto.password, identity.passwordHash))
    ) {
      throw new UnauthorizedException('账号或密码错误');
    }

    return this.userService.recordPasswordLogin(identity.user);
  }
}
