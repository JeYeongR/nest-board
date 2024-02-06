import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserService } from '../../user/user.service';

@Injectable()
export class AccessTokenAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const accessToken = this.extractAccessTokenFromHeader(request);
    if (!accessToken) {
      throw new UnauthorizedException();
    }
    try {
      const { sub: id } = await this.jwtService.verifyAsync(accessToken);
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
}
