import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  // Guard cho login endpoint
  // Khi dùng @UseGuards(LocalAuthGuard):
  //   1. Passport lấy email/password từ body
  //   2. Validate với LocalStrategy
  //   3. Nếu valid → cho phép access và attach user vào request
  //   4. Nếu invalid → trả về 401 Unauthorized
}
