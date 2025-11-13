import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { User } from '../../users/schemas/user.schema';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  // LocalStrategy = Strategy cho login với email/password
  // Passport tự động gọi strategy này khi dùng @UseGuards(LocalAuthGuard)
  
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email', // Dùng email thay vì username
      passwordField: 'password',
    });
  }

  // validate() được Passport tự động gọi
  async validate(email: string, password: string): Promise<User> {
    // 1. Gọi AuthService để validate user
    const user = await this.authService.validateUser(email, password);
    
    // 2. Nếu không hợp lệ → throw error
    if (!user) {
      throw new UnauthorizedException('Email hoặc password không đúng');
    }
    
    // 3. Nếu hợp lệ → trả về user
    // User này sẽ được attach vào request.user
    return user;
  }
}
