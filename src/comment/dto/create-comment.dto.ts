import { IsNotEmpty, IsOptional, IsPositive, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  @MaxLength(20)
  readonly content: string;

  @IsOptional()
  @IsPositive()
  readonly parentId?: number;
}
