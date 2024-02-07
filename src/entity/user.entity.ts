import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({
    length: 30,
    unique: true,
  })
  email: string;

  @Index({ fulltext: true, parser: 'ngram' })
  @Column({ length: 10 })
  nickname: string;

  @Column({ length: 100 })
  password: string;
}
