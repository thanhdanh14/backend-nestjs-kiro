import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Custom decorator để lấy user từ request
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // User đã được attach bởi JwtStrategy
  },
);

// Sử dụng:
// @Get('profile')
// @UseGuards(JwtAuthGuard)
// getProfile(@CurrentUser() user: User) {
//   return user;
// }
