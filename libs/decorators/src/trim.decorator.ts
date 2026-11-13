import { Transform } from 'class-transformer';

/**
 * toClassOnly: 转换为DTO类实例执行Trim
 * 转为DTO类实列运行, 不负责校验
 */
export function Trim(): PropertyDecorator {
  return Transform(
    ({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() : value,
    { toClassOnly: true },
  );
}
