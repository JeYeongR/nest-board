import { Post } from '../../entity/post.entity';
import { UserResponseDto } from '../../user/dto/user-response.dto';

export class PostResponseDto {
  private id: number;

  private title: string;

  private viewCount: number;

  private createdAt: Date;

  private userDto: UserResponseDto;

  private isMyPost: boolean;

  constructor(post: Post, userId?: number) {
    this.id = post.id;
    this.title = post.title;
    this.viewCount = post.viewCount;
    this.createdAt = post.createdAt;
    this.userDto = new UserResponseDto(post.user);
    this.isMyPost = post.user.id === userId;
  }
}
