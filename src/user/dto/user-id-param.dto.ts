import { ValidateBy } from 'class-validator';

// PostgreSQL bigint 的最大值，超出会在查询时触发数值越界错误。
const MAX_BIGINT = 9223372036854775807n;

/** 用户 ID 路径参数；雪花 ID 超出 JS 安全整数范围，按字符串传递和比较。 */
export class UserIdParamDto {
  @ValidateBy({
    name: 'isUserId',
    validator: {
      validate: (value: unknown) =>
        typeof value === 'string' &&
        /^[1-9]\d{0,18}$/.test(value) &&
        BigInt(value) <= MAX_BIGINT,
      defaultMessage: () => 'id必须为有效的用户ID',
    },
  })
  id: string;
}
