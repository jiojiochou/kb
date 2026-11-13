import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { SendEmailVerificationCodeDto } from './dto/send-email-verification-code.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 发送邮箱验证码
  @Post('email/verification-code')
  async sendEmailVerificationCode(
    @Body() emailVerifyDto: SendEmailVerificationCodeDto,
  ) {
    await this.authService.sendEmailVerificationCode(emailVerifyDto);
  }

  // 验证邮箱验证码
  @Post('email/verify')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    await this.authService.verifyEmail(verifyEmailDto);
  }
}
