import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
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
    const { name, emails, photos } = profile;

    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
      ikun: true,
    };
    return user;
  }
}
