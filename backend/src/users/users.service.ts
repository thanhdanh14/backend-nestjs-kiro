import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schemas/user.schema';
import { UsersRepository } from './users.repository';
import { IUsersService } from './interfaces/users-service.interface';
import { Role } from '../auth/enums/role.enum';

@Injectable()
export class UsersService implements IUsersService {
  // Service giờ chỉ gọi Repository
  // Không trực tiếp dùng Model nữa
  
  constructor(private readonly usersRepository: UsersRepository) {
    // Inject Repository thay vì Model
  }

  // ==================== TẠO USER ====================
  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const existingUser = await this.usersRepository.findByEmail(
        createUserDto.email,
      );
      
      if (existingUser) {
        throw new ConflictException('Email đã được sử dụng');
      }

      return await this.usersRepository.create(createUserDto);
      
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Email đã được sử dụng');
      }
      throw error;
    }
  }

  // ==================== ASSIGN ROLES ====================
  async assignRoles(userId: string, roles: string[]): Promise<User> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }

    const updatedUser = await this.usersRepository.updateById(userId, {
      roles,
    });
    
    return updatedUser;
  }

  // ==================== LẤY TẤT CẢ USERS ====================
  async findAll(): Promise<User[]> {
    return await this.usersRepository.findAll();
  }

  // ==================== LẤY 1 USER THEO ID ====================
  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    
    if (!user) {
      throw new NotFoundException(`User với ID ${id} không tồn tại`);
    }
    return user;
  }

  // ==================== CẬP NHẬT USER ====================
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      if (updateUserDto.email) {
        const existingUser = await this.usersRepository.findByEmail(
          updateUserDto.email,
        );
        
        if (existingUser && (existingUser as any)._id.toString() !== id) {
          throw new ConflictException('Email đã được sử dụng');
        }
      }

      const updatedUser = await this.usersRepository.updateById(
        id,
        updateUserDto,
      );

      if (!updatedUser) {
        throw new NotFoundException(`User với ID ${id} không tồn tại`);
      }
      return updatedUser;
      
    } catch (error) {
      if ((error as any).code === 11000) {
        throw new ConflictException('Email đã được sử dụng');
      }
      throw error;
    }
  }

  // ==================== XÓA USER ====================
  async remove(id: string): Promise<{ message: string }> {
    const result = await this.usersRepository.deleteById(id);
    
    if (!result) {
      throw new NotFoundException(`User với ID ${id} không tồn tại`);
    }
    return { message: `Đã xóa user với ID ${id}` };
  }

  // ==================== TÌM USER THEO EMAIL ====================
  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findByEmail(email);
  }

  // ==================== ĐẾM SỐ USERS ====================
  async count(): Promise<number> {
    return await this.usersRepository.count();
  }

  // ==================== SEARCH USERS ====================
  async search(keyword: string): Promise<User[]> {
    return await this.usersRepository.searchByName(keyword);
  }

  // ==================== LẤY USERS THEO TUỔI ====================
  async findByAgeRange(minAge: number, maxAge: number): Promise<User[]> {
    return await this.usersRepository.findByAgeRange(minAge, maxAge);
  }

  // ==================== PAGINATION ====================
  async findWithPagination(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ users: User[]; total: number; page: number; totalPages: number }> {
    const users = await this.usersRepository.findWithPagination({}, page, limit);
    const total = await this.usersRepository.count();
    const totalPages = Math.ceil(total / limit);

    return {
      users,
      total,
      page,
      totalPages,
    };
  }

  // ==================== LOOKUP: GET USER WITH FILES ====================
  async getUserWithFiles(userId: string): Promise<any> {
    const result = await this.usersRepository.findUserWithFiles(userId);
    if (!result || result.length === 0) {
      throw new NotFoundException('User không tồn tại');
    }
    return result[0];
  }

  // ==================== LOOKUP: GET ALL USERS WITH FILE STATS ====================
  async getUsersWithFileStats(): Promise<any[]> {
    return await this.usersRepository.findAllUsersWithFileStats();
  }
}
