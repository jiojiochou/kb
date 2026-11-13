import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Session,
  UseGuards,
} from '@nestjs/common';
import { LoginService } from './login.service.js';
import { LoginDto } from './dto/login.dto.js';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from '../user/user.service.js';
import type { Request } from 'express';
import type { SessionData } from 'express-session';

@Controller('login')
export class LoginController {
  constructor(
    private readonly loginService: LoginService,
    private readonly userService: UserService,
  ) {}

  @Post()
  async login(
    @Body() loginDto: LoginDto,
    @Session() session: SessionData & { user?: unknown },
  ) {
    const user = await this.loginService.login(loginDto);
    session.user = user;

    return user;
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {}

  @Get('callback/google')
  @UseGuards(AuthGuard('google'))
  async googleLoginRedirect(
    @Req() _req: Request,
    @Session() _session: SessionData,
  ) {}

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
    return 'github盐都不盐了';
  }

  @Get('callback/github')
  @UseGuards(AuthGuard('github'))
  async githubLoginRedirect(
    @Req() _req: Request,
    @Session() _session: SessionData,
  ) {}
}
