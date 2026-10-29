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
  async googleLoginRedirect(@Req() req) {
    const user = await this.userService.findGoogleUserByEmail(req.user.email);

    if (!user) {
      const newUser = await this.userService.registerByGoogle(req.user);
      return newUser;
    }

    return user;
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
    return 'ikun';
  }

  @Get('callback/github')
  @UseGuards(AuthGuard('github'))
  async githubLoginRedirect(@Req() req) {
    const user = await this.userService.findUserByGithubId(req.user);

    if (!user) {
      const newUser = this.userService.registerByGithub(req.user);
      return newUser;
    }

    return user;
  }
}
