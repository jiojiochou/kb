import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { AuthService } from './auth.service';
import { VerificationCodeStore } from './verification-code-store.service';

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: { createTransport: jest.fn() },
}));

describe('AuthService email verification sending', () => {
  const email = 'person@example.com';
  let service: AuthService;
  let sendMail: jest.Mock;
  let store: { save: jest.Mock; removeIfMatches: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    sendMail = jest.fn().mockResolvedValue({});
    jest.mocked(nodemailer.createTransport).mockReturnValue({
      sendMail,
    } as unknown as ReturnType<typeof nodemailer.createTransport>);
    store = {
      save: jest.fn().mockResolvedValue(true),
      removeIfMatches: jest.fn().mockResolvedValue(undefined),
    };
    service = new AuthService(
      new ConfigService({}),
      store as unknown as VerificationCodeStore,
    );
  });

  it('sends the code saved after reserving quota', async () => {
    await service.sendEmailVerificationCode({ email });

    const code = store.save.mock.calls[0][1];
    expect(code).toMatch(/^\d{6}$/);
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: email, text: `your captcha is ${code}` }),
    );
  });

  it('returns 429 without sending or deleting a code when quota is exhausted', async () => {
    store.save.mockResolvedValue(false);

    await expect(
      service.sendEmailVerificationCode({ email }),
    ).rejects.toMatchObject({
      status: 429,
    });

    expect(nodemailer.createTransport).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
    expect(store.removeIfMatches).not.toHaveBeenCalled();
  });

  it('does not send when Redis is unavailable', async () => {
    store.save.mockRejectedValue(new Error('Redis unavailable'));

    await expect(
      service.sendEmailVerificationCode({ email }),
    ).rejects.toMatchObject({
      status: 500,
    });

    expect(sendMail).not.toHaveBeenCalled();
  });

  it('removes only the failed code without releasing its sending quota', async () => {
    sendMail.mockRejectedValue(new Error('SMTP unavailable'));

    await expect(
      service.sendEmailVerificationCode({ email }),
    ).rejects.toMatchObject({
      status: 500,
    });

    expect(store.removeIfMatches).toHaveBeenCalledWith(
      email,
      store.save.mock.calls[0][1],
    );
    expect(store.save).toHaveBeenCalledTimes(1);
  });
});
