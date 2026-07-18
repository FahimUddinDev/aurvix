import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RedisService } from '../../database/redis/redis.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;

    const token = this.extractToken(req);
    if (!token) throw new UnauthorizedException('No authentication token provided');

    // Check token blacklist in Redis
    const isRevoked = await this.redis.exists(`revoked:${token}`);
    if (isRevoked) throw new UnauthorizedException('Token has been revoked');

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        algorithms: ['RS256'],
        publicKey: this.config.get<string>('JWT_PUBLIC_KEY'),
      });
      req.user = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  private extractToken(request: any): string | undefined {
    const [type, token] = request.headers?.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
