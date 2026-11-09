import { Trim } from '@app/decorators';
import { IsEmail } from 'class-validator';

export class SendEmailVerificationCodeDto {
  @Trim()
  @IsEmail()
  email: string;
}
