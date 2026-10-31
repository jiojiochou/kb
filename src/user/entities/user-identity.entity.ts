import {
  Column,
  Check,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum IdentityProvider {
  password = 1,
  google = 2,
  github = 3,
}

@Entity({ name: 'user_identities' })
@Unique('uq_user_identity_provider_user', ['provider', 'providerUserId'])
@Index('idx_user_identities_user_id', ['userId'])
@Check('chk_user_identity_provider', 'provider IN (1, 2, 3)')
export class UserIdentity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', name: 'user_id', comment: '系统内部用户 ID' })
  userId: string;

  @ManyToOne(() => User, (user) => user.identities, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'smallint',
    default: IdentityProvider.password,
    comment: '登录渠道：1=password，2=google，3=github',
  })
  provider: IdentityProvider;

  @Column({
    type: 'varchar',
    name: 'provider_user_id',
    length: 255,
    comment: '渠道用户 ID；password 渠道保存规范化账号',
  })
  providerUserId: string;

  @Column({
    type: 'varchar',
    name: 'password_hash',
    length: 255,
    nullable: true,
    select: false,
    comment: '仅 password 渠道使用的密码哈希',
  })
  passwordHash: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'create_time' })
  createTime: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'update_time' })
  updateTime: Date;
}
