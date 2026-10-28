import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryColumn({ type: 'bigint' })
  id: string;

  // 邮箱，唯一
  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    comment: '用户邮箱',
  })
  email: string;

  // 账号，唯一
  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    nullable: false,
    comment: '用户账号',
  })
  account: string;

  // 密码
  @Column({
    type: 'varchar',
    length: 255,
    select: false, // 查询该表的时候忽略此字段
    comment: '用户账号密码',
  })
  password: string;

  // 用户名称
  @Column({
    type: 'varchar',
    length: 50,
    comment: '用户名称',
  })
  name: string;

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
