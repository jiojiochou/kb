import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserIdentity } from './user-identity.entity';

@Entity({ name: 'user' })
export class User {
  @PrimaryColumn({ type: 'bigint' })
  id: string;

  @Column({
    type: 'citext',
    unique: true,
    nullable: true,
    comment: '用户已验证邮箱',
  })
  email: string | null;

  @Column({
    type: 'timestamptz',
    name: 'email_verified_at',
    nullable: true,
    comment: '邮箱所有权验证时间',
  })
  emailVerifiedAt: Date | null;

  @Column({
    type: 'varchar',
    name: 'display_name',
    length: 50,
    nullable: true,
    comment: '账号昵称',
  })
  displayName: string | null;

  @Column({ type: 'varchar', name: 'first_name', length: 50, nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', name: 'last_name', length: 50, nullable: true })
  lastName: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  avatar: string | null;

  @Column({ type: 'timestamptz', name: 'last_login_time', nullable: true })
  lastLoginTime: Date | null;

  @OneToMany(() => UserIdentity, (identity) => identity.user)
  identities: UserIdentity[];

  @CreateDateColumn({ type: 'timestamptz', name: 'create_time' })
  createTime: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'update_time' })
  updateTime: Date;
}
