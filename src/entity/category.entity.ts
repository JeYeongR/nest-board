import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Category {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ length: 20 })
  name: string;
}
