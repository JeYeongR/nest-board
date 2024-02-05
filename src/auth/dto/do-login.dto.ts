import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class DoLoginDto {
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @MaxLength(20)
  readonly password: string;
}
