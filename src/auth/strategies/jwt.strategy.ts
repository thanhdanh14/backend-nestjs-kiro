import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersRepository } from '../../users/users.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // JwtStrategy = Strategy để verify JWT token
  // Passport tự động gọi strategy này khi dùng @UseGuards(JwtAuthGuard)
  
  constructor(private usersRepository: UsersRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Lấy JWT từ header: Authorization: Bearer <token>
      
      ignoreExpiration: false,
      // false = Reject token đã hết hạn
      
      secretOrKey: 'YOUR_SECRET_KEY_CHANGE_THIS_IN_PRODUCTION',
      // Secret key để verify token (phải giống với key trong JwtModule)
    });
  }

  // validate() được Passport tự động gọi sau khi verify token thành công
  async validate(payload: any) {
    // payload = Dữ liệu đã decode từ JWT
    // { sub: '654abc123...', email: 'test@test.com', name: 'An' }
    
    // 1. Lấy user từ database
    const user = await this.usersRepository.findById(payload.sub);
    
    // 2. Nếu user không tồn tại → throw error
    if (!user) {
      throw new UnauthorizedException('User không tồn tại');
    }
    
    // 3. Trả về user
    // User này sẽ được attach vào request.user
    return user;
  }
}
