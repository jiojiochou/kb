import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Trim } from '@app/decorators';

/** 用户资料部分更新；所有字段可省略，但至少需提供一个可更新字段。 */
export class UpdateUserDto {
  /** 新邮箱：去除首尾空格，不可为 null，且不能与已有账户邮箱重复。 */
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEmail()
  @Length(1, 100)
  @Trim()
  email?: string;

  /** 昵称，去除首尾空格后为 1～50 个字符；null 表示清空。 */
  @IsOptional()
  @IsString()
  @Length(1, 50)
  @Trim()
  displayName?: string | null;

  /** 名字，去除首尾空格后为 1～50 个字符；null 表示清空。 */
  @IsOptional()
  @IsString()
  @Length(1, 50)
  @Trim()
  firstName?: string | null;

  /** 姓氏，去除首尾空格后为 1～50 个字符；null 表示清空。 */
  @IsOptional()
  @IsString()
  @Length(1, 50)
  @Trim()
  lastName?: string | null;

  /** 头像 URL，最长 2048 个字符；null 表示清空。 */
  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  avatar?: string | null;
}
