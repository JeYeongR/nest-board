import { Post } from '../../entity/post.entity';
import { UserResponseDto } from '../../user/dto/user-response.dto';

export class PostResponseDto {
  private id: number;

  private title: string;

  private viewCount: number;

  private createdAt: Date;

  private user: UserResponseDto;

  constructor(post: Post) {
    this.id = post.id;
    this.title = post.title;
    this.viewCount = post.viewCount;
    this.createdAt = post.createdAt;
    this.user = new UserResponseDto(post.user);
  }
}
