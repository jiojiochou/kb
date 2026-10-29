import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';

export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: 'Ov23li2FTOLSy113WhXC',
      clientSecret: 'd938ec5dda9798c298730b7c09e89ad7d33c4368',
      callbackURL: 'http://localhost:3000/login/callback/github',
      scope: ['public_profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    return profile;
  }
}
