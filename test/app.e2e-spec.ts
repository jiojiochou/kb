import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { RsaService } from '@app/rsa';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  const repository = {
    find: vi.fn().mockResolvedValue([]),
    create: vi.fn((data) => data),
    save: vi.fn(async (data) => data),
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
});
