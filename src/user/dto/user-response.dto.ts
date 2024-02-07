import { User } from '../../entity/user.entity';

export class UserResponseDto {
  private id: number;

  private nickname: string;

  constructor(user: User) {
    this.id = user.id;
    this.nickname = user.nickname;
  }
}
