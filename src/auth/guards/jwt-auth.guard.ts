import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Guard để protect routes
  // Khi dùng @UseGuards(JwtAuthGuard):
  //   1. Passport lấy token từ header
  //   2. Verify token với JwtStrategy
  //   3. Nếu valid → cho phép access
  //   4. Nếu invalid → trả về 401 Unauthorized
}
