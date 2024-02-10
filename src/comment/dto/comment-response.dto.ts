import { Comment } from '../../entity/comment.entity';
import { UserResponseDto } from '../../user/dto/user-response.dto';

export class CommentResponseDto {
  private id: number;

  private content: string;

  private group: number;

  private sequence: number;

  private depth: number;

  private user: UserResponseDto;

  private isMyComment: boolean;

  constructor(comment: Comment, userId?: number) {
    this.id = comment.id;
    this.content = comment.content;
    this.group = comment.group;
    this.sequence = comment.sequence;
    this.depth = comment.depth;
    this.user = new UserResponseDto(comment.user);
    this.isMyComment = comment.user.id === userId;
  }
}
