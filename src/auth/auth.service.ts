import { Injectable } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import nodemailer from 'nodemailer';
import { SendEmailVerificationCodeDto } from './dto/send-email-verification-code.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}

  async sendEmailVerificationCode(
    emailVerifyDto: SendEmailVerificationCodeDto,
  ) {
    const code = randomInt(100000, 1000000).toString();
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

    const info = await transporter.sendMail({
      from: this.configService.get<string>('QQ_EMAIL_SENDER', ''), // 发件人
      to: emailVerifyDto.email, // 收件人
      subject: "knowledge-base's captcha", // 邮件标题
      text: `your captcha is ${code}`, // 邮件内容
    });

    console.log('邮件发送成功', info.messageId);
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {}
}
