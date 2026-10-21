import { Body, Controller, Post, Session } from '@nestjs/common';
import { LoginService } from './login.service';
import { LoginDto } from './dto/login.dto';

@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Post()
  async login(@Body() loginDto: LoginDto, @Session() session) {
    const user = await this.loginService.login(loginDto);
    session.user = user;

    return user;
  }
}
