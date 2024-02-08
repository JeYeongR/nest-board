import { Image } from '../../entity/image.entity';
import { Post } from '../../entity/post.entity';
import { UserResponseDto } from '../../user/dto/user-response.dto';
import { CategoryResponseDto } from './category-response.dto';
import { ImageResponseDto } from './image-response.dto';

export class PostDetailResponseDto {
  private id: number;

  private title: string;

  private content: string;

  private viewCount: number;

  private createdAt: Date;

  private category: CategoryResponseDto;

  private user: UserResponseDto;

  private image: ImageResponseDto[];

  private isMyPost: boolean;

  constructor(post: Post, userId?: number) {
    this.id = post.id;
    this.title = post.title;
    this.content = post.content;
    this.viewCount = post.viewCount;
    this.createdAt = post.createdAt;
    this.category = new CategoryResponseDto(post.category);
    this.user = new UserResponseDto(post.user);
    this.image = this.mapImageToDto(post.images);
    this.isMyPost = post.user.id === userId;
  }

  private mapImageToDto(images: Image[]): ImageResponseDto[] {
    return images.map((image) => new ImageResponseDto(image));
  }
}
