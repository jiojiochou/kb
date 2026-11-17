import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { VerificationCodeStore } from './verification-code-store.service.js';
import { RedisModule } from '@app/redis';
import { RsaModule } from '@app/rsa';

@Module({
  imports: [RedisModule, RsaModule],
  controllers: [AuthController],
  providers: [AuthService, VerificationCodeStore],
})
export class AuthModule {}
