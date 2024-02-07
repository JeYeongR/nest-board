import { IsEnum, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { PageRequestDto } from '../../common/dto/page-request.dto';
import { PostCategory } from '../enum/post-category.enum';
import { PostCriteria } from '../enum/post-criteria.enum';
import { PostPeriod } from '../enum/post-period.enum';
import { PostSort } from '../enum/post-sort.enum';

export class GetPostDto extends PageRequestDto {
  @IsNotEmpty()
  @IsEnum(PostCategory)
  readonly category: PostCategory;

  @IsOptional()
  @IsEnum(PostSort)
  readonly sort?: PostSort;

  @IsOptional()
  @IsEnum(PostPeriod)
  readonly period?: PostPeriod;

  @IsOptional()
  @MinLength(2)
  readonly keyword?: string;

  @IsOptional()
  @IsEnum(PostCriteria)
  readonly criteria?: PostCriteria;
}
