import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { Image } from './image.entity';
import { User } from './user.entity';

@Entity()
export class Post {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index({ fulltext: true, parser: 'ngram' })
  @Column({ length: 20 })
  title: string;

  @Column({ length: 500 })
  content: string;

  @Column({
    name: 'view_count',
    default: 0,
  })
  viewCount: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => Image, (image) => image.post, { cascade: true })
  images: Image[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
