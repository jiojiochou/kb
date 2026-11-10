import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { VerificationCodeStore } from './verification-code-store.service';
import { RedisModule } from '@app/redis';

@Module({
  imports: [RedisModule],
  controllers: [AuthController],
  providers: [AuthService, VerificationCodeStore],
})
export class AuthModule {}
