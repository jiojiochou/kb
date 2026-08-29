import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateDocumentDto } from './create-document.dto';
import { IsOptional, IsString } from 'class-validator';

/** 更新文档（字段均可选） */
export class UpdateDocumentDto extends PartialType(
  OmitType(CreateDocumentDto, ['createBy'] as const),
) {
  /** 更新人 ID */
  @IsOptional()
  @IsString()
  updateBy?: string;
}
