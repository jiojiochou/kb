import { Module } from '@nestjs/common';
import { LoginService } from './login.service.js';
import { LoginController } from './login.controller.js';
import { GoogleStrategy } from './google.strategy.js';
import { GithubStrategy } from './github.strategy.js';
import { UserModule } from '../user/user.module.js';

@Module({
  imports: [UserModule],
  controllers: [LoginController],
  providers: [LoginService, GoogleStrategy, GithubStrategy],
})
export class LoginModule {}
