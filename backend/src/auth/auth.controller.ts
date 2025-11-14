import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { Role } from './enums/role.enum';
import { User } from '../users/schemas/user.schema';
import { PasswordDto } from './dto/change-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  // ==================== ĐĂNG KÝ ====================
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công' })
  @ApiResponse({ status: 409, description: 'Email đã tồn tại' })
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  // ==================== ĐĂNG NHẬP (Bước 1: Gửi OTP) ====================
  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Đăng nhập - Nhập email/password để nhận OTP',
    description: 'Bước 1: Nhập email và password. Nếu đúng, hệ thống sẽ gửi OTP qua email.'
  })
  @ApiResponse({ status: 200, description: 'OTP đã được gửi đến email' })
  @ApiResponse({ status: 401, description: 'Email hoặc password sai' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(@Body() loginDto: LoginDto, @CurrentUser() user: any) {
    return await this.authService.login(user);
  }

  // ==================== CHANGE PASSWORD ====================
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đổi mật khẩu' })
  @ApiResponse({ status: 200, description: 'Đổi mật khẩu thành công' })
  @ApiResponse({ status: 401, description: 'Mật khẩu hiện tại không đúng' })
  async changePassword(@Body() changePasswordDto: PasswordDto, @CurrentUser() user: any) {
    return await this.authService.changePassword(changePasswordDto, user);
  }

  // ==================== VERIFY OTP (Bước 2: Xác thực OTP) ====================
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xác thực OTP và nhận token' })
  @ApiResponse({ status: 200, description: 'OTP đúng, trả về access_token và refresh_token' })
  @ApiResponse({ status: 401, description: 'OTP không đúng hoặc đã hết hạn' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return await this.authService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp);
  }

  // ==================== RESEND OTP ====================
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gửi lại mã OTP' })
  @ApiResponse({ status: 200, description: 'OTP đã được gửi lại' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy user' })
  async resendOtp(@Body() body: { email: string }) {
    return await this.authService.resendOtp(body.email);
  }

  // ==================== REFRESH TOKEN ====================
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Refresh thành công' })
  @ApiResponse({ status: 401, description: 'Refresh token không hợp lệ' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    const decoded = this.jwtService.decode(refreshTokenDto.refresh_token) as any;
    return await this.authService.refreshTokens(decoded.sub, refreshTokenDto.refresh_token);
  }

  // ==================== LOGOUT ====================
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất' })
  @ApiResponse({ status: 200, description: 'Đăng xuất thành công' })
  async logout(@CurrentUser() user: any) {
    return await this.authService.logout(user._id.toString());
  }

  // ==================== LẤY PROFILE ====================
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy thông tin profile' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async getProfile(@CurrentUser() user: User) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // ==================== ADMIN ONLY ====================
  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  // Thứ tự quan trọng:
  //   1. JwtAuthGuard: Kiểm tra token và lấy user
  //   2. RolesGuard: Kiểm tra user có role phù hợp không
  @Roles(Role.ADMIN)
  // Chỉ ADMIN mới access được
  async adminOnly(@CurrentUser() user: User) {
    return {
      message: 'Chào mừng Admin!',
      user: user.name,
    };
  }

  // ==================== ADMIN OR MODERATOR ====================
  @Get('admin-or-moderator')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  // ADMIN hoặc MODERATOR đều access được
  async adminOrModerator(@CurrentUser() user: User) {
    return {
      message: 'Chào mừng Admin hoặc Moderator!',
      user: user.name,
      roles: user.roles,
    };
  }

  // ==================== PUBLIC ROUTE ====================
  @Get('public')
  // Không có @UseGuards() → Public, ai cũng access được
  async publicRoute() {
    return {
      message: 'Route này public, ai cũng truy cập được',
    };
  }
}
