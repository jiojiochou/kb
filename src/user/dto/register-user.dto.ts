import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Trim } from '@app/decorators';

export class RegisterUserDto {
  @IsString()
  @Length(1, 25)
  @Matches(/^[A-Za-z0-9_]+$/, {
    message: '账号只能包含英文字母、数字和下划线',
  })
  @Trim()
  account: string;

  @IsEmail()
  @Length(1, 100)
  @Trim()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(255)
  @Trim()
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
