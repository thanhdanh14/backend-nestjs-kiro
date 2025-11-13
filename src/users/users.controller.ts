import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './schemas/user.schema';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
// Protect toàn bộ controller
// Tất cả routes đều cần JWT token
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ==================== TẠO USER (ADMIN ONLY) ====================
  @Post()
  @Roles(Role.ADMIN)
  // Chỉ ADMIN mới tạo được user
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // ==================== LẤY TẤT CẢ USERS (ADMIN OR MODERATOR) ====================
  @Get()
  @Roles(Role.ADMIN, Role.MODERATOR)
  // ADMIN hoặc MODERATOR mới xem được danh sách users
  findAll() {
    return this.usersService.findAll();
  }

  // ==================== LẤY USER THEO ID ====================
  @Get(':id')
  // Không có @Roles() → Chỉ cần login (có token) là được
  findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    // User có thể xem thông tin của chính mình
    // hoặc ADMIN có thể xem thông tin của bất kỳ ai
    
    // Logic này nên ở Service, đây chỉ là ví dụ
    return this.usersService.findOne(id);
  }

  // ==================== CẬP NHẬT USER ====================
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: any,
  ) {
    const isAdmin = currentUser.roles?.includes(Role.ADMIN);
    const isOwner = currentUser._id?.toString() === id;
    
    if (!isAdmin && !isOwner) {
      throw new Error('Bạn không có quyền cập nhật user này');
    }
    
    return this.usersService.update(id, updateUserDto);
  }

  // ==================== XÓA USER (ADMIN ONLY) ====================
  @Delete(':id')
  @Roles(Role.ADMIN)
  // Chỉ ADMIN mới xóa được user
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // ==================== LẤY THÔNG TIN CHÍNH MÌNH ====================
  @Get('me/profile')
  getMyProfile(@CurrentUser() user: User) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // ==================== LOOKUP: USER WITH FILES ====================
  @Get(':id/with-files')
  @ApiOperation({ summary: 'Lấy user kèm files đã upload' })
  async getUserWithFiles(@Param('id') id: string) {
    return await this.usersService.getUserWithFiles(id);
  }

  // ==================== LOOKUP: ALL USERS WITH STATS ====================
  @Get('stats/all')
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Lấy tất cả users kèm thống kê files' })
  async getUsersWithStats() {
    return await this.usersService.getUsersWithFileStats();
  }
}
