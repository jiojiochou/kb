import { BadRequestException, Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class LoginService {
  private readonly userRepository;

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

    const { password: _, ...reset } = user;

    return reset;
  }
}
