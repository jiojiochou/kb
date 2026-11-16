import { Trim } from '@app/http-common';
import { IsEmail } from 'class-validator';

export class SendEmailVerificationCodeDto {
  @Trim()
  @IsEmail()
  email: string;
}
