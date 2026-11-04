import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';

export interface GoogleInfo {
  id: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  firstName: string;
  lastName: string;
  picture: string;
}

export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID:
        '208947966520-j26ohjq4hgcn4fjsv737lf4e61tlo1l0.apps.googleusercontent.com',
      clientSecret: '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',
      callbackURL: 'http://localhost:3000/login/callback/google',
      scope: ['email', 'profile'],
    });
  }

  validate(accessToken: string, refreshToken: string, profile: Profile) {
    return profile;
  }
}
