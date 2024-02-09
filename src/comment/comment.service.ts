import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ) {}

  async createComment(
    postId: number,
    user: User,
    createCommentDto: CreateCommentDto,
  ): Promise<void> {
    const foundPost = await this.postRepository.findOneBy({ id: postId });
    if (!foundPost) throw new NotFoundException('NOT_FOUND_POST');

    const { content, parentId } = createCommentDto;

    let foundParentComment: Comment = null;
    if (parentId) {
      foundParentComment = await this.commentRepository.findOneBy({
        id: parentId,
      });
      if (!foundParentComment) throw new NotFoundException('NOT_FOUND_COMMENT');
    }

    const comment = this.commentRepository.create({
      content,
      parent: foundParentComment,
      user,
      post: foundPost,
    });

    await this.commentRepository.save(comment);
  }
}
