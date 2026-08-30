import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { DocumentStatus } from '../entities/document.entity';

/** 创建文档 */
export class CreateDocumentDto {
  /* 文档标题 */
  @IsOptional()
  @IsString()
  title?: string;

  /* markdown正文 */
  @IsOptional()
  @IsString()
  content: string = '';

  /* 摘要 */
  @IsOptional()
  @IsString()
  summary?: string;

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

  /** 封面图 URL */
  @IsOptional()
  @IsString()
  coverImage?: string;

  /** 标签（逗号分隔） */
  @IsOptional()
  @IsString()
  tags?: string;

  /** 状态 */
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  /** 备注 */
  @IsOptional()
  @IsString()
  remark?: string;

  /** 是否公开 */
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  /** 创建人id */
  @IsOptional()
  @IsString()
  createBy?: string;
}
