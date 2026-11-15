import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Patch,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service.js';
import { RegisterUserDto } from './dto/register-user.dto.js';
import { QueryUsersDto } from './dto/query-users.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 分页查询未删除用户，按创建时间、ID 倒序返回。
   * page 默认 1，pageSize 默认 10、最大 100；非法分页参数返回 400。
   * 返回用户列表、用户总数、当前页、每页条数和总页数，不包含密码。
   */
  @Get()
  async findUsers(@Query() queryUsersDto: QueryUsersDto) {
    return await this.userService.findUsers(queryUsersDto);
  }

  /** 注册用户；账号和邮箱（含已软删除账户）不可重复，成功返回不含密码的用户资料。 */
  @Post('register')
  async registerUser(@Body() registerUserDto: RegisterUserDto) {
    return await this.userService.registerUser(registerUserDto);
  }

  /** 检查账号是否已被占用，已软删除账户的账号仍视为占用。 */
  @Get('check-account')
  async checkAccount(@Query('account') account: string) {
    const exists = await this.userService.isAccountTaken(account);
    return { account, exists };
  }

  /** 按账号查询有效用户资料；不存在或已删除返回 404，不返回密码和删除时间。 */
  @Get(':account')
  async findUserByAccount(@Param('account') account: string) {
    const user = await this.userService.findUserByAccount(account);
    if (!user) {
      throw new NotFoundException('账号不存在或已被删除');
    }
    const { password: _, deleteTime: __, ...result } = user;
    return result;
  }

  /**
   * 按账号部分更新邮箱、昵称、姓名和头像，未传字段保持原值。
   * 昵称、姓名和头像可传 null 清空；账号、密码和系统字段不参与更新。
   * 成功返回更新后的资料（不含密码、删除时间）；无有效更新字段返回 400，
   * 账号不存在或已删除返回 404，邮箱被占用返回 409。
   */
  @Patch(':account')
  async updateUser(
    @Param('account') account: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.updateUser(account, updateUserDto);
  }

  /** 软删除指定账号并保留原始资料；成功返回 204，账号不存在或已删除返回 404。 */
  @Delete(':account')
  // NestJS 默认 POST 返回 201，其他请求方法（包括 DELETE）返回 200。
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDeleteUserByAccount(
    @Param('account') account: string,
  ): Promise<void> {
    await this.userService.softDeleteUserByAccount(account);
  }
}
