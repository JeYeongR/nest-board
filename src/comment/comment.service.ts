import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Comment } from '../entity/comment.entity';
import { Post } from '../entity/post.entity';
import { User } from '../entity/user.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly dataSource: DataSource,
  ) {}

  async createComment(
    postId: number,
    user: User,
    createCommentDto: CreateCommentDto,
  ): Promise<void> {
    const foundPost = await this.postRepository.findOneBy({ id: postId });
    if (!foundPost) throw new NotFoundException('NOT_FOUND_POST');

    const { content, parentId } = createCommentDto;

    let comment: Comment = null;
    await this.dataSource.transaction(async (entityManager) => {
      if (!parentId) {
        let maxGroup = await this.commentRepository.maximum('group', {
          post: { id: postId },
        });
        maxGroup++;

        comment = this.commentRepository.create({
          content,
          group: maxGroup,
          post: foundPost,
          user,
        });
      } else {
        const foundParentComment = await this.commentRepository.findOneBy({
          id: parentId,
        });
        if (!foundParentComment)
          throw new NotFoundException('NOT_FOUND_COMMENT');

        const resultSequence = await this.getSequenceAndUpdate(
          foundParentComment,
          entityManager,
        );

        const depth = +foundParentComment.depth;
        comment = this.commentRepository.create({
          content,
          group: foundParentComment.group,
          sequence: resultSequence,
          depth: depth + 1,
          post: foundPost,
          user,
        });

        foundParentComment.childrenNum++;
        await entityManager.save(foundParentComment);
      }

      await entityManager.save(comment);
    });
  }

  private async getSequenceAndUpdate(
    comment: Comment,
    entityManager: EntityManager,
  ): Promise<number> {
    const depth = +comment.depth + 1;
    const sequence = +comment.sequence;
    const childrenNum = +comment.childrenNum;
    const group = +comment.group;

    let childrenNumSum = await this.commentRepository.sum('childrenNum', {
      group,
    });
    childrenNumSum = +childrenNumSum;
    const maxDepth = await this.commentRepository.maximum('depth', { group });

    if (depth < maxDepth) {
      return childrenNumSum + sequence + 1;
    } else if (depth == maxDepth) {
      await entityManager
        .createQueryBuilder()
        .update(Comment)
        .set({ sequence: () => 'sequence + 1' })
        .where('group = :group', { group })
        .andWhere('sequence > :sequence', { sequence: sequence + childrenNum })
        .execute();
      return sequence + childrenNum + 1;
    } else {
      await entityManager
        .createQueryBuilder()
        .update(Comment)
        .set({ sequence: () => 'sequence + 1' })
        .where('group = :group', { group })
        .andWhere('sequence > :sequence', { sequence })
        .execute();
      return sequence + 1;
    }
  }
}
