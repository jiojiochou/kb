import { SnowflakeIdService } from '@street-devs/nest-snowflake-id';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import type { Mock } from 'vitest';
import { User } from './entities/user.entity.js';
import { UserService } from './user.service.js';

describe('UserService updates', () => {
  let service: UserService;
  let findOneBy: Mock;
  let update: Mock;

  beforeEach(() => {
    findOneBy = vi.fn();
    update = vi.fn().mockResolvedValue({ affected: 1 });
    service = new UserService(
      {} as SnowflakeIdService,
      { findOneBy, update } as unknown as Repository<User>,
    );
  });

  it('updates profile fields and excludes sensitive fields from the response', async () => {
    const user = {
      id: '123',
      account: 'person',
      email: 'person@example.com',
      displayName: 'New name',
      firstName: 'Jane',
      password: 'secret',
      deleteTime: null,
    } as User;
    findOneBy.mockResolvedValue(user);

    await expect(
      service.updateUser('123', {
        displayName: 'New name',
        firstName: 'Jane',
      }),
    ).resolves.toEqual({
      id: '123',
      account: 'person',
      email: 'person@example.com',
      displayName: 'New name',
      firstName: 'Jane',
    });
    expect(findOneBy).toHaveBeenCalledExactlyOnceWith({ id: '123' });
    expect(update).toHaveBeenCalledExactlyOnceWith(
      { id: '123', deleteTime: IsNull() },
      { displayName: 'New name', firstName: 'Jane' },
    );
    expect(user.password).toBe('secret');
  });

  it('rejects an empty update payload', async () => {
    await expect(service.updateUser('123', {})).rejects.toMatchObject({
      status: 400,
      message: '至少提供一个需要更新的字段',
    });
    expect(findOneBy).not.toHaveBeenCalled();
  });

  it('returns 404 when the user does not exist', async () => {
    update.mockResolvedValue({ affected: 0 });

    await expect(
      service.updateUser('999', { displayName: 'Name' }),
    ).rejects.toMatchObject({ status: 404, message: '用户不存在或已被删除' });
    expect(findOneBy).not.toHaveBeenCalled();
  });

  it('returns 409 when the new email is already registered', async () => {
    update.mockRejectedValue(
      new QueryFailedError(
        'UPDATE "user"',
        [],
        Object.assign(new Error('unique violation'), {
          code: '23505',
          constraint: 'uq_user_email',
        }),
      ),
    );

    await expect(
      service.updateUser('123', { email: 'other@example.com' }),
    ).rejects.toMatchObject({ status: 409, message: '邮箱已被注册' });
  });
});

describe('UserService pagination', () => {
  let service: UserService;
  let findAndCount: Mock;

  beforeEach(() => {
    findAndCount = vi.fn().mockResolvedValue([[], 0]);
    service = new UserService(
      {} as SnowflakeIdService,
      { findAndCount } as unknown as Repository<User>,
    );
  });

  it('returns the requested page and total count with stable ordering', async () => {
    const items = [{ id: '123', account: 'person' }];
    findAndCount.mockResolvedValue([items, 25]);

    await expect(service.findUsers({ page: 2, pageSize: 10 })).resolves.toEqual(
      {
        items,
        total: 25,
        page: 2,
        pageSize: 10,
        totalPages: 3,
      },
    );
    expect(findAndCount).toHaveBeenCalledExactlyOnceWith({
      select: {
        id: true,
        account: true,
        email: true,
        displayName: true,
        firstName: true,
        lastName: true,
        avatar: true,
        lastLoginTime: true,
        createTime: true,
        updateTime: true,
      },
      where: {},
      order: { createTime: 'DESC', id: 'DESC' },
      skip: 10,
      take: 10,
    });
  });

  it('filters by account when provided', async () => {
    await service.findUsers({ page: 1, pageSize: 10, account: 'person' });
    expect(findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: { account: 'person' } }),
    );
  });

  it.each([0, 15])(
    'returns an empty page while preserving total %i',
    async (total) => {
      findAndCount.mockResolvedValue([[], total]);

      await expect(
        service.findUsers({ page: 3, pageSize: 10 }),
      ).resolves.toEqual({
        items: [],
        total,
        page: 3,
        pageSize: 10,
        totalPages: Math.ceil(total / 10),
      });
    },
  );

  it('rejects offsets that exceed the safe integer range', async () => {
    await expect(
      service.findUsers({ page: Number.MAX_SAFE_INTEGER, pageSize: 100 }),
    ).rejects.toMatchObject({ status: 400 });
    expect(findAndCount).not.toHaveBeenCalled();
  });
});

describe('UserService registration conflicts', () => {
  let service: UserService;
  let find: Mock;
  let save: Mock;
  const registration = {
    account: 'person',
    email: 'person@example.com',
    password: 'password123',
  };

  beforeEach(() => {
    find = vi.fn().mockResolvedValue([]);
    save = vi.fn();
    service = new UserService(
      { generate: () => 123n } as unknown as SnowflakeIdService,
      {
        find,
        create: vi.fn((data) => data),
        save,
      } as unknown as Repository<User>,
    );
  });

  it.each([
    [
      { account: registration.account, email: 'other@example.com' },
      '账号已被注册',
    ],
    [{ account: 'other', email: registration.email }, '邮箱已被注册'],
  ])('keeps deleted registrations reserved: %s', async (user, message) => {
    find.mockResolvedValue([{ ...user, deleteTime: new Date() }]);

    await expect(service.registerUser(registration)).rejects.toMatchObject({
      status: 409,
      message,
    });
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ withDeleted: true }),
    );
    expect(save).not.toHaveBeenCalled();
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

describe('UserService soft deletion', () => {
  let service: UserService;
  let softDelete: Mock;
  let exists: Mock;

  beforeEach(() => {
    softDelete = vi.fn().mockResolvedValue({ affected: 1 });
    exists = vi.fn().mockResolvedValue(true);
    service = new UserService(
      {} as SnowflakeIdService,
      { softDelete, exists } as unknown as Repository<User>,
    );
  });

  it('soft deletes an active user by id', async () => {
    await expect(service.softDeleteUserById('123')).resolves.toBeUndefined();
    expect(softDelete).toHaveBeenCalledExactlyOnceWith({
      id: '123',
      deleteTime: IsNull(),
    });
  });

  it('returns 404 for a missing or already deleted user', async () => {
    softDelete.mockResolvedValue({ affected: 0 });

    await expect(service.softDeleteUserById('123')).rejects.toMatchObject({
      status: 404,
      message: '用户不存在或已被删除',
    });
  });

  it('preserves the first deletion timestamp on repeated deletion', async () => {
    softDelete
      .mockResolvedValueOnce({ affected: 1 })
      .mockResolvedValueOnce({ affected: 0 });

    await service.softDeleteUserById('123');
    await expect(service.softDeleteUserById('123')).rejects.toMatchObject({
      status: 404,
    });
    expect(softDelete).toHaveBeenNthCalledWith(2, {
      id: '123',
      deleteTime: IsNull(),
    });
  });

  it('propagates database failures', async () => {
    const error = new Error('database unavailable');
    softDelete.mockRejectedValue(error);

    await expect(service.softDeleteUserById('123')).rejects.toBe(error);
  });

  it('includes deleted accounts in availability checks', async () => {
    await expect(service.isAccountTaken('person')).resolves.toBe(true);
    expect(exists).toHaveBeenCalledWith({
      where: { account: 'person' },
      withDeleted: true,
    });
  });
});
