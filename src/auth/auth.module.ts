import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RsaService } from './rsa.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, RsaService],
  exports: [RsaService],
})
export class AuthModule {}
