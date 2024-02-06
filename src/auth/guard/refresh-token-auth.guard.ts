import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from '../../user/user.service';
import { AuthService } from '../auth.service';

@Injectable()
export class RefreshTokenAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const accessToken = this.extractAccessTokenFromHeader(request);
    const refreshToken = this.extractRefreshTokenFromHeader(request);
    if (!accessToken || !refreshToken) throw new UnauthorizedException();

    try {
      const { sub: id } = await this.authService.verifyToken(refreshToken);
      const foundUser = await this.userService.findOneById(id);

      request.user = foundUser;
    } catch (error) {
      throw new UnauthorizedException();
    }

    return true;
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
}
