import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { User } from '../entity/user.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const accessToken = this.extractAccessTokenFromHeader(request);
    const refreshToken = this.extractRefreshTokenFromHeader(request);

    try {
      if (!accessToken) throw new UnauthorizedException();

      let foundUser: User;
      if (accessToken && refreshToken) {
        foundUser = await this.getUserFromToken(refreshToken);
      } else {
        foundUser = await this.getUserFromToken(accessToken);
      }

      request.user = foundUser;
      return true;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  private extractAccessTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private extractRefreshTokenFromHeader(request: Request): string | undefined {
    const refreshToken = request.headers.refreshtoken as string;
    const [type, token] = refreshToken?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  async getUserFromToken(token: string) {
    const { sub: id } = await this.jwtService.verifyAsync(token);
    const foundUser = await this.userService.findOneById(id);
    return foundUser;
  }
}
