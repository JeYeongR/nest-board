import { IsNotEmpty, MaxLength } from 'class-validator';

export class UpdatePostDto {
  @IsNotEmpty()
  @MaxLength(20)
  readonly title: string;

  @IsNotEmpty()
  @MaxLength(500)
  readonly content: string;
}
