import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../common/decorator/is-public.decorator';
import { User } from '../../entity/user.entity';
import { UserService } from '../../user/user.service';
import { AuthService } from '../auth.service';

@Injectable()
export class AccessTokenAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const accessToken = this.extractAccessTokenFromHeader(request);
    const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      const foundUser = await this.getUserFromTokenInPublic(accessToken);
      request.user = foundUser;
    } else {
      const foundUser = await this.getUserFromToken(accessToken);
      request.user = foundUser;
    }

    return true;
  }

  private async getUserFromTokenInPublic(token: string): Promise<User> {
    try {
      const { sub: id } = await this.authService.verifyToken(token);
      const foundUser = await this.userService.findOneById(id);

      return foundUser;
    } catch (error) {
      if (error.name === 'TokenExpiredError')
        throw new UnauthorizedException(error.message);
    }
  }

  private async getUserFromToken(token: string): Promise<User> {
    try {
      const { sub: id } = await this.authService.verifyToken(token);
      const foundUser = await this.userService.findOneById(id);

      return foundUser;
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  private extractAccessTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
