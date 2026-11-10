import { PickType } from '@nestjs/mapped-types';
import { SendEmailVerificationCodeDto } from './send-email-verification-code.dto';
import { IsString, Matches } from 'class-validator';
import { Trim } from '@app/decorators';

/**
 * 使用PickType只继承SendEmailVerificationCodeDto的email字段，忽略新字段
 * 使用PartialType字段变成选填
 */
export class VerifyEmailDto extends PickType(SendEmailVerificationCodeDto, [
  'email',
] as const) {
  @Trim()
  @IsString()
  @Matches(/^\d{6}$/, { message: '验证码必须为6位数字' })
  code: string;
}
