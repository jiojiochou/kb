import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Session,
  UseGuards,
} from '@nestjs/common';
import { LoginService } from './login.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from 'src/user/user.service';

@Controller('login')
export class LoginController {
  constructor(
    private readonly loginService: LoginService,
    private readonly userService: UserService,
  ) {}

  @Post()
  async login(@Body() loginDto: LoginDto, @Session() session) {
    const user = await this.loginService.login(loginDto);
    session.user = user;

    return user;
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {}

  @Get('callback/google')
  @UseGuards(AuthGuard('google'))
  async googleLoginRedirect(@Req() req, @Session() session) {
    const user = await this.userService.loginOrRegisterByGoogle(req.user);
    session.user = user;
    return user;
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
    return 'github盐都不盐了';
  }

  @Get('callback/github')
  @UseGuards(AuthGuard('github'))
  async githubLoginRedirect(@Req() req, @Session() session) {
    const user = await this.userService.loginOrRegisterByGithub(req.user);
    session.user = user;
    return user;
  }
}
