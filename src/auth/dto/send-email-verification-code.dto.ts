import { Trim } from '@app/common';
import { IsEmail } from 'class-validator';

export class SendEmailVerificationCodeDto {
  @Trim()
  @IsEmail()
  email: string;
}
