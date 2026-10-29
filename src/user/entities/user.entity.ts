import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RegisterType {
  normal = 1,
  google = 2,
  github = 3,
}

@Entity()
export class User {
  @PrimaryColumn({ type: 'bigint' })
  id: string;

  // 邮箱，唯一
  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    nullable: true,
    comment: '用户邮箱',
  })
  email: string;

  // 账号，唯一
  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    nullable: true,
    comment: '用户账号',
  })
  account: string;

  // 密码
  @Column({
    type: 'varchar',
    length: 255,
    select: false, // 查询该表的时候忽略此字段
    nullable: true,
    comment: '用户账号密码',
  })
  password: string;

  // 用户名称
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '用户名称',
  })
  name: string;

  @Column({
    type: 'varchar',
    name: 'first_name',
    length: 50,
    nullable: true,
    comment: '名',
  })
  firstName: string;

  @Column({
    type: 'varchar',
    name: 'last_name',
    length: 50,
    nullable: true,
    comment: '姓',
  })
  lastName: string;

  @Column({
    name: 'register_type',
    comment: '注册类型: 1.用户名密码注册 2.google自动注册 3.github注册',
    default: 1,
  })
  registerType: RegisterType;

  @Column({
    type: 'varchar',
    nullable: true,
    comment: '头像',
  })
  avatar: string;

  @Column({
    type: 'timestamptz',
    name: 'last_login_time',
    nullable: true,
    comment: '最后登录时间',
  })
  lastLoginTime: Date;

  // 创建时间，插入时自动生成
  @CreateDateColumn({
    type: 'timestamptz',
    name: 'create_time',
    comment: '创建时间',
  })
  createTime: Date;

  // 更新时间，更新时自动维护
  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'update_time',
    comment: '更新时间',
  })
  updateTime: Date;
}
