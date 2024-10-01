import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_MIXED_KEY, IS_PUBLIC_KEY } from 'src/constants';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const isAllowedBoth = this.reflector.getAllAndOverride<boolean>(
      IS_MIXED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isAllowedBoth) {
      const hasHeader = context.switchToHttp().getRequest()
        .headers.authorization;

      if (hasHeader) {
        return super.canActivate(context);
      }
      return true;
    }

    return super.canActivate(context);
  }
}
