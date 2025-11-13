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
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { Role } from './enums/role.enum';
import { User } from '../users/schemas/user.schema';

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

  // ==================== ĐĂNG NHẬP ====================
  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
  @ApiResponse({ status: 401, description: 'Email hoặc password sai' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(@Body() loginDto: LoginDto, @CurrentUser() user: User) {
    return await this.authService.login(loginDto);
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
