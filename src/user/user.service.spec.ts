import { SnowflakeIdService } from '@street-devs/nest-snowflake-id';
import { QueryFailedError, Repository } from 'typeorm';
import type { Mock } from 'vitest';
import { User } from './entities/user.entity.js';
import { UserService } from './user.service.js';

describe('UserService registration conflicts', () => {
  let service: UserService;
  let save: Mock;
  const registration = {
    account: 'person',
    email: 'person@example.com',
    password: 'password123',
  };

  beforeEach(() => {
    save = vi.fn();
    service = new UserService(
      { generate: () => 123n } as unknown as SnowflakeIdService,
      {
        find: vi.fn().mockResolvedValue([]),
        create: vi.fn((data) => data),
        save,
      } as unknown as Repository<User>,
    );
  });

  it.each([
    ['uq_user_account', '账号已被注册'],
    ['uq_user_email', '邮箱已被注册'],
  ])(
    'returns 409 for concurrent conflicts on %s',
    async (constraint, message) => {
      save.mockRejectedValue(
        new QueryFailedError(
          'INSERT INTO "user"',
          [],
          Object.assign(new Error('unique violation'), {
            code: '23505',
            constraint,
          }),
        ),
      );

      await expect(service.registerUser(registration)).rejects.toMatchObject({
        status: 409,
        message,
      });
    },
  );

  it.each([
    ['23505', 'PK_user_id'],
    ['23505', undefined],
    ['23502', 'uq_user_account'],
  ])('returns 500 for code %s and constraint %s', async (code, constraint) => {
    save.mockRejectedValue(
      new QueryFailedError(
        'INSERT INTO "user"',
        [],
        Object.assign(new Error('database failure'), {
          code,
          constraint,
          detail: 'Key (email)=(person@example.com) already exists.',
        }),
      ),
    );

    await expect(service.registerUser(registration)).rejects.toMatchObject({
      status: 500,
    });
  });
});
