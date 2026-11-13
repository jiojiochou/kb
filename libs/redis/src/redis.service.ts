import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;

  constructor(configService: ConfigService) {
    this.client = new Redis({
      host: configService.get<string>('REDIS_HOST', 'localhost'),
      port: Number(configService.get('REDIS_PORT', 6379)),
      password: configService.get<string>('REDIS_PASSWORD') || undefined,
      db: Number(configService.get('REDIS_DB', 0)),
      lazyConnect: true,
      connectTimeout: 5000,
      maxRetriesPerRequest: 1,
    });
    this.client.on('error', () => {
      this.logger.error('Redis connection failed');
    });
  }

  onModuleDestroy(): void {
    this.client.disconnect();
  }
}
