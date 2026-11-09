import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly configSevice: ConfigService) {
    super({
      clientID: configSevice.get<string>('GITHUB_OAUTH_CLIENT_ID', ''),
      clientSecret: configSevice.get<string>('GITHUB_OAUTH_SECRET', ''),
      callbackURL: 'http://localhost:3000/login/callback/github',
      scope: ['public_profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    return profile;
  }
}
