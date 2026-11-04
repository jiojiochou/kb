import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'user' })
export class User {
  @PrimaryColumn({
    type: 'bigint',
    unique: true,
    comment: '用户唯一id',
  })
  id: string;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    comment: '用户账号',
  })
  account: string;

  @Column({
    type: 'citext',
    unique: true,
    comment: '用户已验证邮箱',
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 255,
    select: false,
    comment: '用户账号密码',
  })
  password: string;

  @Column({
    type: 'boolean',
    name: 'email_verify',
    default: false,
  })
  emailVerify: boolean;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'display_name',
    comment: '账号昵称',
  })
  displayName: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'first_name',
    comment: '用户名字',
  })
  firstName: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'last_name',
    comment: '用户姓',
  })
  lastName: string | null;

  @Column({
    type: 'varchar',
    length: 2048,
    nullable: true,
    comment: '账号头像',
  })
  avatar: string | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'last_login_time',
    comment: '账号最后登录时间',
  })
  lastLoginTime: Date | null;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'create_time',
    comment: '创建时间',
  })
  createTime: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'update_time',
    comment: '更新时间',
  })
  updateTime: Date;
}
