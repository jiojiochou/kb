import { Injectable } from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import {
  DocumentContent,
  DocumentContentDocument,
} from './schemas/document-content.schema';
import { Model } from 'mongoose';

@Injectable()
export class DocumentService {
  constructor(
    /** Postgres 实体管理器 */
    @InjectEntityManager()
    private readonly em: EntityManager,
    /** Mongo 正文模型 */
    @InjectModel(DocumentContent.name)
    private readonly contentModel: Model<DocumentContentDocument>,
  ) {}

  create(dto: CreateDocumentDto) {}

  findAll(query: QueryDocumentDto) {}

  findOne(id: string) {}

  update(id: string) {}

  remove(id: string) {}
}
