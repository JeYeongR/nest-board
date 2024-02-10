import { IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @IsNotEmpty()
  @MaxLength(20)
  readonly content: string;
}
