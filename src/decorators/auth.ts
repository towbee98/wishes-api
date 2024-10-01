import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { IS_MIXED_KEY, IS_PUBLIC_KEY } from 'src/constants';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const AllowBoth = () => SetMetadata(IS_MIXED_KEY, true);

export const AuthUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
