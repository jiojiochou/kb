import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { RedisModule } from './redis.module.js';
import { RedisService } from './redis.service.js';

@Module({
  imports: [RedisModule],
})
class FirstConsumerModule {
  constructor(readonly redis: RedisService) {}
}

@Module({
  imports: [RedisModule],
})
class SecondConsumerModule {
  constructor(readonly redis: RedisService) {}
}

describe('RedisModule', () => {
  it('shares one lazy connection across modules and disconnects on close', async () => {
    const module = await Test.createTestingModule({
      imports: [FirstConsumerModule, SecondConsumerModule],
    })
      .overrideProvider(ConfigService)
      .useValue(new ConfigService({}))
      .compile();
    const service = module.get(RedisService);
    const disconnect = vi.spyOn(service.client, 'disconnect');

    try {
      expect(module.get(FirstConsumerModule).redis).toBe(service);
      expect(module.get(SecondConsumerModule).redis).toBe(service);
      expect(service.client.status).toBe('wait');
      expect(service.client.options).toMatchObject({
        host: 'localhost',
        port: 6379,
        db: 0,
        lazyConnect: true,
      });
    } finally {
      await module.close();
    }

    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(service.client.status).toBe('end');
  });

  it('loads connection options from ConfigService', async () => {
    const module = await Test.createTestingModule({
      imports: [RedisModule],
    })
      .overrideProvider(ConfigService)
      .useValue(
        new ConfigService({
          REDIS_HOST: 'redis.internal',
          REDIS_PORT: '6380',
          REDIS_PASSWORD: 'test-password',
          REDIS_DB: '2',
        }),
      )
      .compile();

    try {
      expect(module.get(RedisService).client.options).toMatchObject({
        host: 'redis.internal',
        port: 6380,
        password: 'test-password',
        db: 2,
      });
    } finally {
      await module.close();
    }
  });
});
