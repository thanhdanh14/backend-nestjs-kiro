import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../users/users.repository';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/schemas/user.schema';
import { IAuthService } from './interfaces/auth-service.interface';
import { MailService } from '../mail/mail.service';
import { PasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  // ==================== ĐĂNG KÝ ====================
  async register(registerDto: RegisterDto): Promise<{ message: string; email: string }> {
    const existingUser = await this.usersRepository.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.usersRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    // Tạo OTP 6 số
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otpCode, 10);
    
    // OTP hết hạn sau 5 phút
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 5);
    
    // Lưu OTP vào database
    await this.usersRepository.updateById((user as any)._id.toString(), {
      otpCode: hashedOtp,
      otpExpires: otpExpires,
    });

    // Gửi OTP qua email
    try {
      await this.mailService.sendOtpEmail(user.email, user.name, otpCode);
    } catch (error) {
      console.error('Lỗi khi gửi OTP email:', error);
      throw new ConflictException('Không thể gửi OTP. Vui lòng thử lại.');
    }

    return {
      message: 'Đăng ký thành công! OTP đã được gửi đến email của bạn.',
      email: user.email,
    };
  }

  // ==================== CHANGE PASSWORD ====================
  async changePassword(dto: PasswordDto, user: any): Promise<{ message: string }> {
    // Lấy user từ database
    const currentUser = await this.usersRepository.findById(user._id?.toString());
    
    if (!currentUser) {
      throw new UnauthorizedException('User không tồn tại');
    }
    
    // Kiểm tra mật khẩu hiện tại có đúng không
    const isPasswordValid = await bcrypt.compare(dto.currentPassword, (currentUser as any).password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    }
    
    // Kiểm tra mật khẩu mới không được giống mật khẩu cũ
    const isSamePassword = await bcrypt.compare(dto.newPassword, (currentUser as any).password);
    if (isSamePassword) {
      throw new UnauthorizedException('Mật khẩu mới không được giống mật khẩu hiện tại');
    }
    
    // Hash mật khẩu mới
    const hashedNewPassword = await bcrypt.hash(dto.newPassword, 10);
    
    // Cập nhật mật khẩu mới
    await this.usersRepository.updateById(user._id?.toString(), {
      password: hashedNewPassword,
    });
    
    // Gửi email thông báo đổi mật khẩu thành công
    try {
      await this.mailService.sendPasswordChangedEmail(
        currentUser.email,
        currentUser.name,
      );
    } catch (error) {
      console.error('Lỗi khi gửi email thông báo:', error);
      // Không throw error để không ảnh hưởng đến quá trình đổi mật khẩu
    }
    
    return {
      message: 'Đổi mật khẩu thành công',
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

  // ==================== LOGIN (Bước 1: Gửi OTP) ====================
  async login(user: any): Promise<{ message: string; email: string }> {
    // Tạo OTP 6 số
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash OTP trước khi lưu
    const hashedOtp = await bcrypt.hash(otpCode, 10);
    
    // OTP hết hạn sau 5 phút
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 5);
    
    // Lưu OTP vào database
    await this.usersRepository.updateById(user._id?.toString(), {
      otpCode: hashedOtp,
      otpExpires: otpExpires,
    });
    
    // Gửi OTP qua email
    try {
      await this.mailService.sendOtpEmail(user.email, user.name, otpCode);
    } catch (error) {
      console.error('Lỗi khi gửi OTP email:', error);
      throw new UnauthorizedException('Không thể gửi OTP. Vui lòng thử lại.');
    }
    
    return {
      message: 'OTP đã được gửi đến email của bạn. Vui lòng kiểm tra và xác thực.',
      email: user.email,
    };
  }

  // ==================== VERIFY OTP (Bước 2: Xác thực OTP và trả token) ====================
  async verifyOtp(email: string, otp: string): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.usersRepository.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedException('Email không tồn tại');
    }
    
    // Kiểm tra OTP có tồn tại không
    if (!(user as any).otpCode || !(user as any).otpExpires) {
      throw new UnauthorizedException('OTP không hợp lệ hoặc đã hết hạn');
    }
    
    // Kiểm tra OTP đã hết hạn chưa
    if (new Date() > new Date((user as any).otpExpires)) {
      throw new UnauthorizedException('OTP đã hết hạn. Vui lòng đăng nhập lại.');
    }
    
    // Kiểm tra OTP có đúng không
    const isOtpValid = await bcrypt.compare(otp, (user as any).otpCode);
    if (!isOtpValid) {
      throw new UnauthorizedException('OTP không đúng');
    }
    
    // OTP đúng → Tạo tokens
    const tokens = await this.generateTokens(user);
    
    // Lưu refresh token và xóa OTP
    const hashedRefreshToken = await bcrypt.hash(tokens.refresh_token, 10);
    await this.usersRepository.updateById((user as any)._id.toString(), {
      refreshToken: hashedRefreshToken,
      otpCode: null,
      otpExpires: null,
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

  // ==================== RESEND OTP ====================
  async resendOtp(email: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedException('Email không tồn tại');
    }
    
    // Tạo OTP mới
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otpCode, 10);
    
    // OTP hết hạn sau 5 phút
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 5);
    
    // Lưu OTP mới
    await this.usersRepository.updateById((user as any)._id.toString(), {
      otpCode: hashedOtp,
      otpExpires: otpExpires,
    });
    
    // Gửi OTP qua email
    try {
      await this.mailService.sendOtpEmail(user.email, user.name, otpCode);
    } catch (error) {
      console.error('Lỗi khi gửi OTP email:', error);
      throw new UnauthorizedException('Không thể gửi OTP. Vui lòng thử lại.');
    }
    
    return {
      message: 'OTP mới đã được gửi đến email của bạn',
    };
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
