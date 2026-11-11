import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { randomInt } from 'node:crypto';
import nodemailer from 'nodemailer';
import { SendEmailVerificationCodeDto } from './dto/send-email-verification-code.dto';
import { ConfigService } from '@nestjs/config';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerificationCodeStore } from './verification-code-store.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly verificationCodeStore: VerificationCodeStore,
  ) {}

  async sendEmailVerificationCode(
    emailVerifyDto: SendEmailVerificationCodeDto,
  ) {
    const code = randomInt(100000, 1000000).toString();
    let saved: boolean;
    try {
      // 先检查发送额度并保存验证码，Redis 失败或额度耗尽时不发送邮件。
      saved = await this.verificationCodeStore.save(emailVerifyDto.email, code);
    } catch {
      throw new InternalServerErrorException('验证码保存失败，请稍后重试');
    }
    if (!saved) {
      throw new HttpException(
        '验证码发送次数已达上限，请稍后重试',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    /**
     * 发邮件使用SMTP协议
     * 收邮件使用POP3协议、IMAP协议
     */
    const transporter = nodemailer.createTransport({
      host: this.configService.get<string>('QQ_EMAIL_HOST', ''),
      port: 587,
      secure: false,
      auth: {
        user: this.configService.get<string>('QQ_EMAIL_SENDER', ''),
        pass: this.configService.get<string>('QQ_EMAIL_OAUTH_PASS', ''),
      },
    });

    try {
      /**
       * TODO:
       * sendMail({
       *  html: ....
       * })
       * 后续可以传入html美化一下邮件消息
       */
      await transporter.sendMail({
        from: this.configService.get<string>('QQ_EMAIL_SENDER', ''), // 发件人
        to: emailVerifyDto.email, // 收件人
        subject: "knowledge-base's captcha", // 邮件标题
        text: `your captcha is ${code}`, // 邮件内容
      });
    } catch {
      await this.verificationCodeStore
        .removeIfMatches(emailVerifyDto.email, code)
        .catch(() => undefined);
      throw new InternalServerErrorException('验证码邮件发送失败，请稍后重试');
    }
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {}
}
