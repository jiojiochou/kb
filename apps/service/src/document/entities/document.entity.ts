/** 文档状态 */
export enum DocumentStatus {
  /** 草稿 */
  Draft = 0,
  /** 已发布 */
  Published = 1,
  /** 已归档：不会作为知识被检索 */
  Archived = 2,
}

export class Document {}
