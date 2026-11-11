import { ConfigService } from '@nestjs/config';
import { RedisService } from '@app/redis';
import { VerificationCodeStore } from './verification-code-store.service';

describe('VerificationCodeStore sending quota', () => {
  const transaction = {
    incr: jest.fn().mockReturnThis(),
    expire: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };
  const setCode = jest.fn();
  const multi = jest.fn().mockReturnValue(transaction);
  const redisService = {
    client: { multi, set: setCode },
  } as unknown as RedisService;

  beforeEach(() => {
    jest.clearAllMocks();
    transaction.exec.mockReset().mockResolvedValue([
      [null, 1],
      [null, 1],
    ]);
    setCode.mockReset().mockResolvedValue('OK');
  });

  it('uses a shared normalized email quota with the default limit and window', async () => {
    const store = new VerificationCodeStore(
      redisService,
      new ConfigService({}),
    );

    await expect(store.save(' Person@Example.com ', '123456')).resolves.toBe(
      true,
    );

    expect(multi).toHaveBeenCalledTimes(1);
    expect(transaction.incr).toHaveBeenCalledWith(
      'auth:email-verification:send-limit:person@example.com',
    );
    expect(transaction.expire).toHaveBeenCalledWith(
      'auth:email-verification:send-limit:person@example.com',
      3600,
      'NX',
    );
    expect(setCode).toHaveBeenCalledWith(
      'auth:email-verification:Person@Example.com',
      '123456',
      'EX',
      300,
    );
  });

  it('honors configured limits and reports rejected reservations', async () => {
    transaction.exec.mockResolvedValue([
      [null, 11],
      [null, 0],
    ]);
    const store = new VerificationCodeStore(
      redisService,
      new ConfigService({
        EMAIL_VERIFICATION_SEND_LIMIT: '10',
        EMAIL_VERIFICATION_SEND_WINDOW_SECONDS: '86400',
      }),
    );

    await expect(store.save('person@example.com', '123456')).resolves.toBe(
      false,
    );
    expect(transaction.expire).toHaveBeenCalledWith(
      'auth:email-verification:send-limit:person@example.com',
      86400,
      'NX',
    );
    expect(setCode).not.toHaveBeenCalled();
  });

  it('allows the fifth request even when the expiry already exists', async () => {
    transaction.exec.mockResolvedValue([
      [null, 5],
      [null, 0],
    ]);
    const store = new VerificationCodeStore(
      redisService,
      new ConfigService({}),
    );

    await expect(store.save('person@example.com', '123456')).resolves.toBe(
      true,
    );
    expect(setCode).toHaveBeenCalledTimes(1);
  });

  it('rejects the sixth request without overwriting the existing code', async () => {
    transaction.exec.mockResolvedValue([
      [null, 6],
      [null, 0],
    ]);
    const store = new VerificationCodeStore(
      redisService,
      new ConfigService({}),
    );

    await expect(store.save('person@example.com', '123456')).resolves.toBe(
      false,
    );
    expect(setCode).not.toHaveBeenCalled();
  });

  it.each([0, 1])(
    'does not save a code when transaction command %i fails',
    async (index) => {
      const error = new Error('Redis command failed');
      const results: [Error | null, number | null][] = [
        [null, 1],
        [null, 1],
      ];
      results[index] = [error, null];
      transaction.exec.mockResolvedValue(results);
      const store = new VerificationCodeStore(
        redisService,
        new ConfigService({}),
      );

      await expect(store.save('person@example.com', '123456')).rejects.toBe(
        error,
      );
      expect(setCode).not.toHaveBeenCalled();
    },
  );

  it('does not save a code when the transaction is aborted', async () => {
    transaction.exec.mockResolvedValue(null);
    const store = new VerificationCodeStore(
      redisService,
      new ConfigService({}),
    );

    await expect(store.save('person@example.com', '123456')).rejects.toThrow(
      '发送计数事务未执行',
    );
    expect(setCode).not.toHaveBeenCalled();
  });

  it('propagates transaction connection failures without saving a code', async () => {
    const error = new Error('Redis unavailable');
    transaction.exec.mockRejectedValue(error);
    const store = new VerificationCodeStore(
      redisService,
      new ConfigService({}),
    );

    await expect(store.save('person@example.com', '123456')).rejects.toBe(
      error,
    );
    expect(setCode).not.toHaveBeenCalled();
  });

  it('propagates code storage failures after reserving quota', async () => {
    const error = new Error('Code storage failed');
    setCode.mockRejectedValue(error);
    const store = new VerificationCodeStore(
      redisService,
      new ConfigService({}),
    );

    await expect(store.save('person@example.com', '123456')).rejects.toBe(
      error,
    );
  });

  it.each(['0', '-1', '1.5', '', 'invalid'])(
    'rejects invalid limit or window configuration: %j',
    (value) => {
      for (const name of [
        'EMAIL_VERIFICATION_SEND_LIMIT',
        'EMAIL_VERIFICATION_SEND_WINDOW_SECONDS',
      ]) {
        expect(
          () =>
            new VerificationCodeStore(
              redisService,
              new ConfigService({ [name]: value }),
            ),
        ).toThrow(`${name} must be a positive integer`);
      }
    },
  );
});

describe('VerificationCodeStore conditional consumption', () => {
  const evalScript = jest.fn();
  let store: VerificationCodeStore;

  beforeEach(() => {
    evalScript.mockReset();
    store = new VerificationCodeStore(
      { client: { eval: evalScript } } as unknown as RedisService,
      new ConfigService({}),
    );
  });

  it('returns true when the matching code is deleted', async () => {
    evalScript.mockResolvedValue(1);

    await expect(
      store.removeIfMatches(' person@example.com ', '123456'),
    ).resolves.toBe(true);
    expect(evalScript).toHaveBeenCalledWith(
      expect.any(String),
      1,
      'auth:email-verification:person@example.com',
      '123456',
    );
  });

  it('returns false when no matching code was deleted', async () => {
    evalScript.mockResolvedValue(0);

    await expect(
      store.removeIfMatches('person@example.com', '123456'),
    ).resolves.toBe(false);
  });

  it('propagates Redis errors to the caller', async () => {
    const error = new Error('Redis unavailable');
    evalScript.mockRejectedValue(error);

    await expect(
      store.removeIfMatches('person@example.com', '123456'),
    ).rejects.toBe(error);
  });
});
