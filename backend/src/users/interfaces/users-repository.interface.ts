import { FilterQuery, UpdateQuery } from 'mongoose';
import { User } from '../schemas/user.schema';

// Interface cho Repository
// Định nghĩa tất cả methods mà Repository phải có
export interface IUsersRepository {
  // ==================== BASIC CRUD ====================
  create(userData: Partial<User>): Promise<User>;
  
  findAll(): Promise<User[]>;
  
  findById(id: string): Promise<User | null>;
  
  findOne(filter: FilterQuery<User>): Promise<User | null>;
  
  updateById(id: string, updateData: UpdateQuery<User>): Promise<User | null>;
  
  deleteById(id: string): Promise<User | null>;

  // ==================== QUERY METHODS ====================
  findByEmail(email: string): Promise<User | null>;
  
  count(filter?: FilterQuery<User>): Promise<number>;
  
  findWithPagination(
    filter: FilterQuery<User>,
    page: number,
    limit: number,
  ): Promise<User[]>;
  
  searchByName(keyword: string): Promise<User[]>;
  
  findByAgeRange(minAge: number, maxAge: number): Promise<User[]>;
  
  exists(filter: FilterQuery<User>): Promise<boolean>;
  
  findByCondition(filterOptions: FilterQuery<User>): Promise<any[]>;
}
