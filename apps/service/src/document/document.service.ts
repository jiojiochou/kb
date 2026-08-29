import { Injectable } from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';

@Injectable()
export class DocumentService {
  constructor(private readonly em) {}
  create(dto: CreateDocumentDto) {}

  findAll(query: QueryDocumentDto) {}

  findOne(id: string) {}

  update(id: string) {}

  remove(id: string) {}
}
