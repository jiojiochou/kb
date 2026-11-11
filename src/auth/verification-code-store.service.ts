import { Injectable } from '@nestjs/common';
import { RedisService } from '@app/redis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VerificationCodeStore {
  private readonly ttlSeconds = 5 * 60;
  private readonly sendLimit: number;
  private readonly sendWindowSeconds: number;

  constructor(
    private readonly redisService: RedisService,
    configService: ConfigService,
  ) {
    this.sendLimit = this.positiveInteger(
      configService,
      'EMAIL_VERIFICATION_SEND_LIMIT',
      5,
    );
    this.sendWindowSeconds = this.positiveInteger(
      configService,
      'EMAIL_VERIFICATION_SEND_WINDOW_SECONDS',
      3600,
    );
  }

  async save(email: string, code: string): Promise<boolean> {
    const redis = this.redisService.client;
    const limitKey = `auth:email-verification:send-limit:${email.trim().toLowerCase()}`;

    // 原子增加请求计数；NX 仅在没有过期时间时设置窗口，避免后续请求续期。
    const results = await redis
      .multi()
      .incr(limitKey)
      .expire(limitKey, this.sendWindowSeconds, 'NX')
      .exec();

    if (!results) {
      throw new Error('发送计数事务未执行');
    }
    for (const [error] of results) {
      if (error) throw error;
    }

    // 超限请求也计数，但不会保存验证码或延长计数窗口。
    const count = Number(results[0][1]);
    if (count > this.sendLimit) {
      return false;
    }

    await redis.set(this.key(email), code, 'EX', this.ttlSeconds);
    return true;
  }

  async removeIfMatches(email: string, code: string): Promise<boolean> {
    // 校验成功即消费验证码；同时避免发送失败时误删另一次请求生成的验证码。
    const removed = await this.redisService.client.eval(
      `if redis.call('GET', KEYS[1]) == ARGV[1] then
        return redis.call('DEL', KEYS[1])
      end
      return 0`,
      1,
      this.key(email),
      code,
    );
    return removed === 1;
  }

  private key(email: string): string {
    return `auth:email-verification:${email.trim()}`;
  }

  private positiveInteger(
    configService: ConfigService,
    name: string,
    defaultValue: number,
  ): number {
    const value = Number(configService.get(name, defaultValue));
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new Error(`${name} must be a positive integer`);
    }
    return value;
  }
}
