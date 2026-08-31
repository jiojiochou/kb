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
import { UpdateDocumentDto } from './dto/update-document.dto';
import { nextSnowflakeId } from 'src/common/snowflake-id';
import { DocumentEntity, DocumentStatus } from './entities/document.entity';

/**
 * 文档服务
 * - 元数据：PostgreSQL（kb_document）
 * - 正文：MongoDB（document_content）
 * - 关联：content_id ↔ Mongo _id，documentId ↔ 文档 id
 */
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

  /**
   * 创建文档
   * 流程：生成雪花 ID → 写 Mongo 正文（拿 ObjectId）→ 写 Postgres 元数据
   * 若 Postgres 写入失败，回滚删除已写入的 Mongo 正文，避免脏数据
   */
  async create(dto: CreateDocumentDto) {
    const id = nextSnowflakeId(); // 生成雪花id
    const wordCount = this.countWords(dto.content); // 内容字数
    const status = dto.status ?? DocumentStatus.Draft; // 文档状态
    // 内容摘要, 没传时截取正文当摘要
    const contentSummary = dto.summary ?? this.buildContentSummary(dto.content);

    // 写入mongo
    const contentDoc = await this.contentModel.create({
      documentId: id,
      content: dto.content,
      contentLength: dto.content.length, // to do: 耗时吗?
      contentSummary,
      version: 1,
      deleted: false,
    });

    // ObjectId 转字符串，存入 Postgres content_id
    const contentId = String(contentDoc._id);

    try {
      const doc = this.em.create(DocumentEntity, {
        id,
        title: dto.title,
        contentId,
        summary: dto.summary,
        categoryId: dto.categoryId,
        teamId: dto.teamId,
        authorId: dto.authorId,
        coverImage: dto.coverImage,
        tags: dto.tags,
        status,
        remark: dto.remark,
        isPublic: dto.isPublic ?? false,
        wordCount,
        // 创建即发布时，记录发布时间
        publishTime: status === DocumentStatus.Published ? new Date() : null,
        createBy: dto.createBy,
        updateBy: dto.createBy,
        deleted: false,
      });

      const saved = await this.em.save(doc);
      return { ...saved, content: dto.content };
    } catch (error) {
      // Postgres 失败：物理删除刚写入的 Mongo 正文
      await this.contentModel.deleteOne({ _id: contentDoc._id });
      throw error;
    }
  }

  async findAll(query: QueryDocumentDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    // 默认排除已软删记录
    const qb = this.em
      .createQueryBuilder(DocumentEntity, 'doc')
      .where('doc.deleted = :deleted and doc.is_public = :is_public', {
        deleted: false,
        is_public: true,
      });

    // 标题模糊匹配（不区分大小写）
    if (query.title) {
      qb.andWhere('doc.title ILIKE :title', { title: `%${query.title}%` });
    }
    if (query.categoryId) {
      qb.andWhere('doc.category_id = :categoryId', {
        categoryId: query.categoryId,
      });
    }
    if (query.teamId) {
      qb.andWhere('doc.team_id = :teamId', { teamId: query.teamId });
    }
    if (query.authorId) {
      qb.andWhere('doc.author_id = :authorId', { authorId: query.authorId });
    }
    if (query.status !== undefined) {
      qb.andWhere('doc.status = :status', { status: query.status });
    }

    // 按创建时间倒序，再分页
    qb.orderBy('doc.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  findOne(id: string) {}

  update(id: string, dto: UpdateDocumentDto) {}

  remove(id: string) {}

  private buildContentSummary(content: string, maxLen = 200): string {
    const trimmed = content.trim().replace(/\s+/g, ' ');
    return trimmed.length <= maxLen
      ? trimmed
      : `${trimmed.slice(0, maxLen)}...`;
  }

  /**
   * 统计正文字数（中英混合）
   * - 中日韩汉字：每个字符计 1 字
   * - 英文等拉丁文本：按空白分词，每个单词计 1 字
   */
  private countWords(content: string): number {
    const trimmed = content.trim();
    if (!trimmed) {
      return 0;
    }

    // 匹配所有 CJK 统一汉字（U+4E00–U+9FFF），每个汉字算 1
    const cjk = (trimmed.match(/[\u4e00-\u9fff]/g) ?? []).length;

    // 去掉汉字后，剩余按空白切分为英文单词再计数
    const latin = trimmed
      .replace(/[\u4e00-\u9fff]/g, ' ') // 汉字替换为空格，避免与英文粘连
      .trim()
      .split(/\s+/) // 按连续空白分词
      .filter(Boolean).length; // 去掉空串

    return cjk + latin;
  }
}
