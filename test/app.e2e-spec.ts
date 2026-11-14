import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, IsNull } from 'typeorm';
import { RsaService } from '@app/rsa';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  const repository = {
    find: vi.fn().mockResolvedValue([]),
    findAndCount: vi.fn().mockResolvedValue([[], 0]),
    findOneBy: vi.fn(),
    update: vi.fn().mockResolvedValue({ affected: 1 }),
    create: vi.fn((data) => data),
    save: vi.fn(async (data) => data),
    softDelete: vi.fn().mockResolvedValue({ affected: 1 }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DataSource)
      .useValue({
        options: { type: 'postgres' },
        entityMetadatas: [],
        getRepository: () => repository,
      })
      .overrideProvider(ConfigService)
      .useValue(
        new ConfigService({
          GOOGLE_OAUTH_CLIENT_ID: 'test-client',
          GOOGLE_OAUTH_CLIENT_SECRET: 'test-secret',
          GITHUB_OAUTH_CLIENT_ID: 'test-client',
          GITHUB_OAUTH_SECRET: 'test-secret',
        }),
      )
      .overrideProvider(RsaService)
      .useValue({ initializeSecretKey: vi.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('registers through the Express adapter and excludes the password', async () => {
    const response = await request(app.getHttpServer())
      .post('/user/register')
      .send({
        account: ' user.name-1 ',
        email: ' person@example.com ',
        password: 'password123',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      account: 'user.name-1',
      email: 'person@example.com',
    });
    expect(response.body).not.toHaveProperty('password');
  });

  it('rejects an invalid account before accessing the database', async () => {
    repository.find.mockClear();

    await request(app.getHttpServer())
      .post('/user/register')
      .send({
        account: 'user@name',
        email: 'person@example.com',
        password: 'password123',
      })
      .expect(400);

    expect(repository.find).not.toHaveBeenCalled();
  });

  it('uses default pagination for GET /user', async () => {
    repository.findAndCount.mockClear();

    const response = await request(app.getHttpServer())
      .get('/user')
      .expect(200);

    expect(response.body).toEqual({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    });
    expect(repository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 10 }),
    );
  });

  it('transforms pagination query strings and returns user data', async () => {
    const items = [
      { id: '123', account: 'person', email: 'person@example.com' },
    ];
    repository.findAndCount.mockResolvedValueOnce([items, 21]);

    const response = await request(app.getHttpServer())
      .get('/user?page=2&pageSize=10')
      .expect(200);

    expect(response.body).toEqual({
      items,
      total: 21,
      page: 2,
      pageSize: 10,
      totalPages: 3,
    });
    expect(repository.findAndCount).toHaveBeenLastCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });

  it('updates user profile fields through PATCH /user/:account', async () => {
    const user = {
      id: '123',
      account: 'person',
      email: 'person@example.com',
      displayName: 'New name',
      firstName: 'Jane',
      password: 'secret',
      deleteTime: null,
    };
    repository.findOneBy.mockResolvedValueOnce(user);

    const response = await request(app.getHttpServer())
      .patch('/user/person')
      .send({ displayName: 'New name', firstName: 'Jane' })
      .expect(200);

    expect(response.body).toEqual({
      id: '123',
      account: 'person',
      email: 'person@example.com',
      displayName: 'New name',
      firstName: 'Jane',
    });
    expect(response.body).not.toHaveProperty('password');
    expect(repository.update).toHaveBeenLastCalledWith(
      { account: 'person', deleteTime: IsNull() },
      { displayName: 'New name', firstName: 'Jane' },
    );
  });

  it('rejects an empty update body before querying', async () => {
    repository.findOneBy.mockClear();

    await request(app.getHttpServer())
      .patch('/user/person')
      .send({})
      .expect(400);

    expect(repository.findOneBy).not.toHaveBeenCalled();
  });

  it('returns 404 when updating an unknown account', async () => {
    repository.update.mockResolvedValueOnce({ affected: 0 });

    const response = await request(app.getHttpServer())
      .patch('/user/missing')
      .send({ displayName: 'Name' })
      .expect(404);

    expect(response.body.message).toBe('账号不存在或已被删除');
  });

  it.each([
    { email: null },
    { email: 'invalid' },
    { displayName: '   ' },
    { firstName: 123 },
    { lastName: 'a'.repeat(51) },
    { avatar: 'invalid' },
    { account: 'other', password: 'new-password', deleteTime: null },
  ])(
    'rejects an invalid update before accessing the database: %j',
    async (body) => {
      repository.update.mockClear();

      await request(app.getHttpServer())
        .patch('/user/person')
        .send(body)
        .expect(400);

      expect(repository.update).not.toHaveBeenCalled();
    },
  );

  it('trims names, clears nullable fields, and ignores protected fields', async () => {
    repository.findOneBy.mockResolvedValueOnce({
      account: 'person',
      displayName: 'New name',
      avatar: null,
    });

    await request(app.getHttpServer())
      .patch('/user/person')
      .send({
        displayName: ' New name ',
        avatar: null,
        account: 'other',
        password: 'new-password',
        deleteTime: null,
      })
      .expect(200);

    expect(repository.update).toHaveBeenLastCalledWith(
      { account: 'person', deleteTime: IsNull() },
      { displayName: 'New name', avatar: null },
    );
  });

  it.each([
    'page=0',
    'page=-1',
    'page=1.5',
    'page=abc',
    'page=',
    'page=1&page=2',
    'page=9007199254740992',
    'page=9007199254740991&pageSize=100',
    'pageSize=0',
    'pageSize=101',
    'pageSize=1.5',
    'pageSize=abc',
    'pageSize=',
    'pageSize=1&pageSize=2',
  ])('rejects invalid pagination before querying: %s', async (query) => {
    repository.findAndCount.mockClear();

    await request(app.getHttpServer()).get(`/user?${query}`).expect(400);

    expect(repository.findAndCount).not.toHaveBeenCalled();
  });

  it('soft deletes an account through DELETE /user/:account', async () => {
    repository.softDelete.mockClear();

    const response = await request(app.getHttpServer())
      .delete('/user/user.name-1')
      .expect(204);

    expect(response.text).toBe('');
    expect(repository.softDelete).toHaveBeenCalledExactlyOnceWith({
      account: 'user.name-1',
      deleteTime: IsNull(),
    });
  });

  it('returns 404 when the account is missing or already deleted', async () => {
    repository.softDelete.mockResolvedValueOnce({ affected: 0 });

    const response = await request(app.getHttpServer())
      .delete('/user/missing')
      .expect(404);

    expect(response.body.message).toBe('账号不存在或已被删除');
  });

  it('rejects a blank account before accessing the database', async () => {
    repository.softDelete.mockClear();

    await request(app.getHttpServer()).delete('/user/%20').expect(400);

    expect(repository.softDelete).not.toHaveBeenCalled();
  });
});
