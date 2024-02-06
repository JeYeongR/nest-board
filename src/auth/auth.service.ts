import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../entity/user.entity';
import { UserService } from '../user/user.service';
import { DoLoginDto } from './dto/do-login.dto';
import { TokenDto } from './dto/token.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async doLogin(doLoginDto: DoLoginDto): Promise<TokenDto> {
    const { email, password } = doLoginDto;

    const foundUser = await this.userService.findOneByEmail(email);
    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) throw new UnauthorizedException('INVALID_PASSWORD');

    const foundUserId = foundUser.id;
    const accessToken = this.generateAccessToken(foundUserId);
    const refreshToken = this.generateRefreshToken(foundUserId);

    return new TokenDto(accessToken, refreshToken);
  }

  async reissueAccessToken(user: User): Promise<TokenDto> {
    const accessToken = this.generateAccessToken(user.id);

    return new TokenDto(accessToken);
  }

  private generateAccessToken(userId: number): string {
    return this.jwtService.sign({ sub: userId }, { expiresIn: '1h' });
  }

  private generateRefreshToken(userId: number): string {
    return this.jwtService.sign({ sub: userId }, { expiresIn: '7d' });
  }
}
