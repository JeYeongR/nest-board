import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from './post.entity';
import { User } from './user.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ length: 20 })
  content: string;

  @Column({ type: 'bigint' })
  group: number;

  @Column({
    default: 1,
    type: 'bigint',
  })
  sequence: number;

  @Column({
    default: 1,
    type: 'bigint',
  })
  depth: number;

  @Column({
    default: 0,
    name: 'children_num',
  })
  childrenNum: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;
}
