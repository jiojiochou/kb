import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { UserService } from './user.service.js';
import { RegisterUserDto } from './dto/register-user.dto.js';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async registerUser(@Body() registerUserDto: RegisterUserDto) {
    return await this.userService.registerUser(registerUserDto);
  }

  @Get('check-account')
  async checkAccount(@Query('account') account: string) {
    const exists = await this.userService.isAccountTaken(account);
    return { account, exists };
  }
}
