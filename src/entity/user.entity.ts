import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({
    length: 30,
    unique: true,
  })
  email: string;

  @Column({ length: 20 })
  password: string;
}
