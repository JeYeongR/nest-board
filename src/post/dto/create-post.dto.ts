import { IsEnum, IsNotEmpty, MaxLength } from 'class-validator';
import { PostCategory } from '../enum/post-category.enum';

export class CreatePostDto {
  @IsNotEmpty()
  @MaxLength(20)
  readonly title: string;

  @IsNotEmpty()
  @MaxLength(500)
  readonly content: string;

  @IsNotEmpty()
  @IsEnum(PostCategory)
  readonly category: PostCategory;
}
