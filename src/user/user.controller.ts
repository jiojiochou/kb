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
import { UserIdParamDto } from './dto/user-id-param.dto.js';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 分页查询未删除用户，按创建时间、ID 倒序返回；可传 account 按账号精确筛选。
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

  /**
   * 以下按账号操作的接口与按 ID 的接口并存；放在 account/ 子路径下，
   * 避免纯数字账号与 /user/:id 混淆。
   */

  /** 按账号查询有效用户资料；不存在或已删除返回 404，不返回密码和删除时间。 */
  @Get('account/:account')
  async findUserByAccount(@Param('account') account: string) {
    const user = await this.userService.findUserByAccount(account);
    if (!user) {
      throw new NotFoundException('账号不存在或已被删除');
    }
    const { password: _, deleteTime: __, ...result } = user;
    return result;
  }

  /** 按账号部分更新用户资料，规则同 PATCH /user/:id；账号不存在或已删除返回 404。 */
  @Patch('account/:account')
  async updateUserByAccount(
    @Param('account') account: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.updateUserByAccount(account, updateUserDto);
  }

  /** 按账号软删除用户；成功返回 204，账号不存在或已删除返回 404。 */
  @Delete('account/:account')
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDeleteUserByAccount(
    @Param('account') account: string,
  ): Promise<void> {
    await this.userService.softDeleteUserByAccount(account);
  }

  /** 按 ID 查询有效用户资料；ID 非法返回 400，不存在或已删除返回 404，不返回密码和删除时间。 */
  @Get(':id')
  async findUserById(@Param() { id }: UserIdParamDto) {
    const user = await this.userService.findUserById(id);
    if (!user) {
      throw new NotFoundException('用户不存在或已被删除');
    }
    const { password: _, deleteTime: __, ...result } = user;
    return result;
  }

  /**
   * 按 ID 部分更新邮箱、昵称、姓名和头像，未传字段保持原值。
   * 昵称、姓名和头像可传 null 清空；账号、密码和系统字段不参与更新。
   * 成功返回更新后的资料（不含密码、删除时间）；ID 非法或无有效更新字段返回 400，
   * 用户不存在或已删除返回 404，邮箱被占用返回 409。
   */
  @Patch(':id')
  async updateUser(
    @Param() { id }: UserIdParamDto,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.updateUser(id, updateUserDto);
  }

  /** 软删除指定用户并保留原始资料；成功返回 204，ID 非法返回 400，不存在或已删除返回 404。 */
  @Delete(':id')
  // NestJS 默认 POST 返回 201，其他请求方法（包括 DELETE）返回 200。
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDeleteUserById(@Param() { id }: UserIdParamDto): Promise<void> {
    await this.userService.softDeleteUserById(id);
  }
}
