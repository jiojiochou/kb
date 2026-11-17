import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { Trim } from '@app/http-common';

export class RegisterUserDto {
  @IsString()
  @Length(1, 25)
  @Matches(/^[A-Za-z0-9_.-]+$/, {
    message: '账号只能包含英文字母、数字、下划线、点和连字符',
  })
  @Trim()
  account: string;

  @IsEmail()
  @Length(1, 100)
  @Trim()
  email: string;

  /**
   * 前端用 GET /auth/public-key 返回的公钥以 RSA-OAEP-256 加密后的 base64 密文。
   * 密文格式和明文长度在 UserService 解密时校验；不做 Trim，避免改动密文。
   */
  @IsString()
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  displayName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  lastName?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  avatar?: string;
}
