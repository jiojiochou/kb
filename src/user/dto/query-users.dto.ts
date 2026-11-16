import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { Trim } from '@app/http-common';

export class QueryUsersDto {
  /** 页码，从 1 开始；未传时查询第一页。 */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  page: number = 1;

  /** 每页条数，默认 10，最多 100，限制单次查询的数据量。 */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 10;

  /** 按账号精确筛选，去除首尾空格；未传时不筛选。 */
  @IsOptional()
  @IsString()
  @Length(1, 25)
  @Trim()
  account?: string;
}
