import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/** 文档列表查询 */
export class QueryDocumentDto {
  /** 标题（模糊） */
  @IsOptional()
  @IsString()
  title?: string;

  /** 分类 ID */
  @IsOptional()
  @IsString()
  categoryId?: string;

  /** 团队 ID */
  @IsOptional()
  @IsString()
  teamId?: string;

  /** 作者 ID */
  @IsOptional()
  @IsString()
  authorId?: string;

  /** 状态 */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(100)
  pageSize?: number = 20;
}
