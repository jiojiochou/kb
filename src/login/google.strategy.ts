import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configSevice: ConfigService) {
    super({
      clientID: configSevice.get<string>('GOOGLE_OAUTH_CLIENT_ID', ''),
      clientSecret: configSevice.get<string>('GOOGLE_OAUTH_CLIENT_SECRET', ''),
      callbackURL: 'http://localhost:3000/login/callback/google',
      scope: ['email', 'profile'],
    });
  }

  validate(accessToken: string, refreshToken: string, profile: Profile) {
    return profile;
  }
}
