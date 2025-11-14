import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../schemas/user.schema';

// Interface định nghĩa "hợp đồng" cho UsersService
// Bất kỳ class nào implement interface này phải có đầy đủ các methods
export interface IUsersService {
  // ==================== CRUD METHODS ====================
  create(createUserDto: CreateUserDto): Promise<User>;
  
  findAll(): Promise<User[]>;
  
  findOne(id: string): Promise<User>;
  
  update(id: string, updateUserDto: UpdateUserDto): Promise<User>;
  
  remove(id: string): Promise<{ message: string }>;

  // ==================== ADDITIONAL METHODS ====================
  findByEmail(email: string): Promise<User | null>;
  
  count(): Promise<number>;
  
  search(keyword: string): Promise<User[]>;
  
  findByAgeRange(minAge: number, maxAge: number): Promise<User[]>;
  
  findWithPagination(
    page?: number,
    limit?: number,
  ): Promise<{
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  }>;
}
