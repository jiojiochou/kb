import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service.js';
import { RegisterUserDto } from './dto/register-user.dto.js';
import { QueryUsersDto } from './dto/query-users.dto.js';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findUsers(@Query() queryUsersDto: QueryUsersDto) {
    return await this.userService.findUsers(queryUsersDto);
  }

  @Post('register')
  async registerUser(@Body() registerUserDto: RegisterUserDto) {
    return await this.userService.registerUser(registerUserDto);
  }

  @Get('check-account')
  async checkAccount(@Query('account') account: string) {
    const exists = await this.userService.isAccountTaken(account);
    return { account, exists };
  }

  @Delete(':account')
  // NestJS 默认 POST 返回 201，其他请求方法（包括 DELETE）返回 200。
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDeleteUserByAccount(
    @Param('account') account: string,
  ): Promise<void> {
    await this.userService.softDeleteUserByAccount(account);
  }
}
