import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Tree,
  TreeChildren,
  TreeParent,
} from 'typeorm';

@Entity()
@Tree('closure-table')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20 })
  content: string;

  @TreeChildren()
  children: Comment[];

  @TreeParent()
  parent: Comment;
}
