import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 50,
  })
  name: string;

  @Column({
    unique: true,
  })
  account: string;

  @Column()
  password: string;

  @Column({
    unique: true,
  })
  mail: string;
}
