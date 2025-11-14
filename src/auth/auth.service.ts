import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../users/users.repository';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/schemas/user.schema';
import { IAuthService } from './interfaces/auth-service.interface';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  // ==================== ĐĂNG KÝ ====================
  async register(registerDto: RegisterDto): Promise<{ user: any; access_token: string; refresh_token: string }> {
    const existingUser = await this.usersRepository.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.usersRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    const tokens = await this.generateTokens(user);
    
    // Hash và lưu refresh token
    const hashedRefreshToken = await bcrypt.hash(tokens.refresh_token, 10);
    await this.usersRepository.updateById((user as any)._id.toString(), {
      refreshToken: hashedRefreshToken,
    });

    const { password: _, refreshToken: __, ...userWithoutPassword } = (user as any).toObject();
    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  // ==================== VALIDATE USER (Dùng cho Login) ====================
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, (user as any).password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  // ==================== LOGIN ====================
  async login(user: any): Promise<{ access_token: string; refresh_token: string }> {
    const tokens = await this.generateTokens(user);
    
    const hashedRefreshToken = await bcrypt.hash(tokens.refresh_token, 10);
    await this.usersRepository.updateById(user._id.toString(), {
      refreshToken: hashedRefreshToken,
    });
    
    return tokens;
  }

  // ==================== REFRESH TOKENS ====================
  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersRepository.findById(userId);
    
    if (!user || !(user as any).refreshToken) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
    
    const isValid = await bcrypt.compare(refreshToken, (user as any).refreshToken);
    if (!isValid) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
    
    const tokens = await this.generateTokens(user);
    
    const hashedRefreshToken = await bcrypt.hash(tokens.refresh_token, 10);
    await this.usersRepository.updateById(userId, {
      refreshToken: hashedRefreshToken,
    });
    
    return tokens;
  }

  // ==================== LOGOUT ====================
  async logout(userId: string) {
    await this.usersRepository.updateById(userId, {
      refreshToken: null,
    });
    return { message: 'Đăng xuất thành công' };
  }

  // ==================== GENERATE TOKENS ====================
  private async generateTokens(user: any): Promise<{ access_token: string; refresh_token: string }> {
    const payload = {
      sub: user._id,
      email: user.email,
      name: user.name,
    };

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }
}
