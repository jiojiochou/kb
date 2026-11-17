import { Body, Controller, Get, Header, Post } from '@nestjs/common';
import { RsaService } from '@app/rsa';
import { AuthService } from './auth.service.js';
import { SendEmailVerificationCodeDto } from './dto/send-email-verification-code.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly rsaService: RsaService,
  ) {}

  /**
   * 获取 RSA 公钥，前端用它以 RSA-OAEP-256 加密密码后再提交注册或登录。
   * 禁止缓存：密钥对重新生成后，前端拿到的必须是新公钥，否则后端无法解密。
   */
  @Get('public-key')
  @Header('Cache-Control', 'no-store')
  getPublicKey() {
    return this.rsaService.getPublicKey();
  }

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
