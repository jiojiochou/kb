import { Module } from '@nestjs/common';
import { LoginService } from './login.service';
import { LoginController } from './login.controller';
import { GoogleStrategy } from './google.strategy';
import { GithubStrategy } from './github.strategy';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [UserModule],
  controllers: [LoginController],
  providers: [LoginService, GoogleStrategy, GithubStrategy],
})
export class LoginModule {}
