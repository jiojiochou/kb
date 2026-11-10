import { Injectable } from '@nestjs/common';
import { RedisService } from '@app/redis';

@Injectable()
export class VerificationCodeStore {
  private readonly ttlSeconds = 5 * 60;

  constructor(private readonly redisService: RedisService) {}

  async save(email: string, code: string): Promise<void> {
    await this.redisService.client.set(
      this.key(email),
      code,
      'EX',
      this.ttlSeconds,
    );
  }

  async removeIfMatches(email: string, code: string): Promise<void> {
    // 避免发送失败时误删另一次请求生成的验证码。
    await this.redisService.client.eval(
      `if redis.call('GET', KEYS[1]) == ARGV[1] then
        return redis.call('DEL', KEYS[1])
      end
      return 0`,
      1,
      this.key(email),
      code,
    );
  }

  private key(email: string): string {
    return `auth:email-verification:${email.trim()}`;
  }
}
