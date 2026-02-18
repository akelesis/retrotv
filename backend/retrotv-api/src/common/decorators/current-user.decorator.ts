import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // Prefer JWT-authenticated user id (request.user.id from JwtStrategy)
    if (request.user && request.user.id) return request.user.id;
    const header = request.headers['x-user-id'] || request.headers['X-User-Id'];
    return header || null;
  },
);
