# 📋 Interface Pattern trong NestJS

## Interface là gì?

**Interface** trong TypeScript là "hợp đồng" (contract) định nghĩa cấu trúc của một object hoặc class.

### Ví dụ đơn giản
```typescript
// Interface định nghĩa User phải có gì
interface IUser {
  name: string;
  email: string;
  age?: number; // Optional
}

// Object phải theo đúng interface
const user: IUser = {
  name: "An",
  email: "an@test.com",
  age: 25
};

// ❌ Lỗi: Thiếu email
const invalidUser: IUser = {
  name: "An"
};
```

---

## Tại sao dùng Interface cho Service/Repository?

### 1. Type Safety (An toàn kiểu dữ liệu)
```typescript
// Interface định nghĩa Service phải có methods gì
interface IUsersService {
  create(dto: CreateUserDto): Promise<User>;
  findAll(): Promise<User[]>;
}

// Class phải implement đầy đủ
class UsersService implements IUsersService {
  // ✅ Có đầy đủ methods
  async create(dto: CreateUserDto): Promise<User> { ... }
  async findAll(): Promise<User[]> { ... }
}

// ❌ TypeScript báo lỗi nếu thiếu method
class BadService implements IUsersService {
  async create(dto: CreateUserDto): Promise<User> { ... }
  // Lỗi: Thiếu method findAll()
}
```

### 2. Dễ Test (Mock Interface)
```typescript
// Mock Service dễ dàng
const mockUsersService: IUsersService = {
  create: jest.fn().mockResolvedValue(mockUser),
  findAll: jest.fn().mockResolvedValue([mockUser]),
  findOne: jest.fn().mockResolvedValue(mockUser),
  // ... các methods khác
};

// Dùng mock trong test
const controller = new UsersController(mockUsersService);
```

### 3. Dependency Inversion Principle (SOLID)
```typescript
// ✅ TỐT: Phụ thuộc vào interface (abstraction)
class UsersController {
  constructor(private service: IUsersService) {}
  // Controller không quan tâm implementation cụ thể
  // Có thể thay UsersService bằng MockUsersService, CachedUsersService, etc.
}

// ❌ KHÔNG TỐT: Phụ thuộc vào class cụ thể
class UsersController {
  constructor(private service: UsersService) {}
  // Khó thay đổi implementation
}
```

### 4. Documentation
```typescript
// Interface = Documentation rõ ràng
// Nhìn interface là biết Service có methods gì
interface IUsersService {
  create(dto: CreateUserDto): Promise<User>;
  findAll(): Promise<User[]>;
  findOne(id: string): Promise<User>;
  // ...
}
```

---

## Cấu trúc trong Project

```
src/users/
├── interfaces/
│   ├── users-service.interface.ts      # Interface cho Service
│   └── users-repository.interface.ts   # Interface cho Repository
├── users.service.ts                    # Implement IUsersService
├── users.repository.ts                 # Implement IUsersRepository
└── users.controller.ts                 # Dùng IUsersService
```

---

## Giải thích từng file

### 📄 src/users/interfaces/users-service.interface.ts

```typescript
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../schemas/user.schema';

// Interface = Hợp đồng cho UsersService
// Định nghĩa Service PHẢI có những methods nào
export interface IUsersService {
  // ==================== CRUD METHODS ====================
  
  create(createUserDto: CreateUserDto): Promise<User>;
  // Method create phải:
  //   - Nhận CreateUserDto
  //   - Trả về Promise<User>
  
  findAll(): Promise<User[]>;
  // Method findAll phải:
  //   - Không nhận tham số
  //   - Trả về Promise<User[]>
  
  findOne(id: string): Promise<User>;
  // Method findOne phải:
  //   - Nhận id (string)
  //   - Trả về Promise<User>
  
  update(id: string, updateUserDto: UpdateUserDto): Promise<User>;
  
  remove(id: string): Promise<{ message: string }>;

  // ==================== ADDITIONAL METHODS ====================
  
  findByEmail(email: string): Promise<User | null>;
  // Trả về User hoặc null
  
  count(): Promise<number>;
  
  search(keyword: string): Promise<User[]>;
  
  findByAgeRange(minAge: number, maxAge: number): Promise<User[]>;
  
  findWithPagination(
    page?: number,      // ? = Optional parameter
    limit?: number,
  ): Promise<{
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  }>;
}

// Lưu ý:
// - Interface CHỈ định nghĩa signature (chữ ký)
// - KHÔNG có implementation (code thực thi)
// - Class implement interface sẽ viết code thực tế
```

---

### 📄 src/users/interfaces/users-repository.interface.ts

```typescript
import { FilterQuery, UpdateQuery } from 'mongoose';
import { User } from '../schemas/user.schema';

export interface IUsersRepository {
  // Interface cho Repository
  // Định nghĩa tất cả database operations
  
  // ==================== BASIC CRUD ====================
  
  create(userData: Partial<User>): Promise<User>;
  // Partial<User> = Một phần properties của User
  
  findAll(): Promise<User[]>;
  
  findById(id: string): Promise<User | null>;
  // Trả về User hoặc null (không throw error)
  
  findOne(filter: FilterQuery<User>): Promise<User | null>;
  // FilterQuery<User> = MongoDB query filter
  
  updateById(
    id: string,
    updateData: UpdateQuery<User>,
  ): Promise<User | null>;
  
  deleteById(id: string): Promise<User | null>;

  // ==================== QUERY METHODS ====================
  
  findByEmail(email: string): Promise<User | null>;
  
  count(filter?: FilterQuery<User>): Promise<number>;
  // filter? = Optional parameter
  
  findWithPagination(
    filter: FilterQuery<User>,
    page: number,
    limit: number,
  ): Promise<User[]>;
  
  searchByName(keyword: string): Promise<User[]>;
  
  findByAgeRange(minAge: number, maxAge: number): Promise<User[]>;
  
  exists(filter: FilterQuery<User>): Promise<boolean>;
  
  findByCondition(filterOptions: FilterQuery<User>): Promise<any[]>;
  // any[] vì aggregation có thể trả về structure khác
}
```

---

### 📄 src/users/users.service.ts - Implement Interface

```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schemas/user.schema';
import { UsersRepository } from './users.repository';
import { IUsersService } from './interfaces/users-service.interface';

@Injectable()
export class UsersService implements IUsersService {
  // implements IUsersService = Class này PHẢI có đầy đủ methods trong interface
  // TypeScript sẽ báo lỗi compile-time nếu:
  //   - Thiếu method nào
  //   - Method có signature sai (tham số, return type)
  
  constructor(private readonly repository: UsersRepository) {}

  // ==================== IMPLEMENT INTERFACE METHODS ====================
  
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Method này PHẢI match với signature trong interface
    // async create(createUserDto: CreateUserDto): Promise<User>
    
    const existing = await this.repository.findByEmail(createUserDto.email);
    if (existing) {
      throw new ConflictException('Email đã được sử dụng');
    }
    return await this.repository.create(createUserDto);
  }

  async findAll(): Promise<User[]> {
    // PHẢI trả về Promise<User[]>
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<User> {
    // PHẢI trả về Promise<User> (không phải User | null)
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (updateUserDto.email) {
      const existing = await this.repository.findByEmail(updateUserDto.email);
      if (existing && existing._id.toString() !== id) {
        throw new ConflictException('Email đã được sử dụng');
      }
    }

    const updated = await this.repository.updateById(id, updateUserDto);
    if (!updated) {
      throw new NotFoundException('User không tồn tại');
    }
    return updated;
  }

  async remove(id: string): Promise<{ message: string }> {
    // PHẢI trả về Promise<{ message: string }>
    const result = await this.repository.deleteById(id);
    if (!result) {
      throw new NotFoundException('User không tồn tại');
    }
    return { message: `Đã xóa user với ID ${id}` };
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.repository.findByEmail(email);
  }

  async count(): Promise<number> {
    return await this.repository.count();
  }

  async search(keyword: string): Promise<User[]> {
    return await this.repository.searchByName(keyword);
  }

  async findByAgeRange(minAge: number, maxAge: number): Promise<User[]> {
    return await this.repository.findByAgeRange(minAge, maxAge);
  }

  async findWithPagination(page: number = 1, limit: number = 10) {
    const users = await this.repository.findWithPagination({}, page, limit);
    const total = await this.repository.count();
    const totalPages = Math.ceil(total / limit);

    return { users, total, page, totalPages };
  }
}

// Nếu thiếu bất kỳ method nào trong IUsersService
// → TypeScript báo lỗi ngay khi compile
// → Không thể chạy được
```

---

### 📄 src/users/users.repository.ts - Implement Interface

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, UpdateQuery } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { IUsersRepository } from './interfaces/users-repository.interface';

@Injectable()
export class UsersRepository implements IUsersRepository {
  // implements IUsersRepository = PHẢI có đầy đủ methods
  
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // Implement tất cả methods từ interface
  async create(userData: Partial<User>): Promise<User> { ... }
  async findAll(): Promise<User[]> { ... }
  async findById(id: string): Promise<User | null> { ... }
  // ... các methods khác
}
```

---

## Ví dụ thực tế từ dự án của bạn

```typescript
// ==================== INTERFACE ====================
export interface IFaqCategoryService {
  getByCondition(
    pageOptions: FaqCategoryPageOptions
  ): Promise<FaqCategoryDTO[]>;
}

// ==================== SERVICE IMPLEMENT ====================
@Injectable()
export class FaqCategoryService implements IFaqCategoryService {
  constructor(private readonly repository: FaqCategoryRepository) {}

  async getByCondition(
    pageOptions: FaqCategoryPageOptions
  ): Promise<FaqCategoryDTO[]> {
    // Business logic
    if (pageOptions.page < 1) {
      throw new BadRequestException('Page phải >= 1');
    }

    // Gọi Repository
    const rawFaqs = await this.repository.findByCondition(pageOptions);
    
    // Transform data
    return rawFaqs.map(faq => new FaqCategoryDTO(faq));
  }
}

// ==================== CONTROLLER ====================
@Controller('faq-categories')
export class FaqCategoryController {
  constructor(
    private readonly service: IFaqCategoryService
    // Inject interface, không phải class cụ thể
  ) {}

  @Get()
  async getCategories(@Query() pageOptions: FaqCategoryPageOptions) {
    return await this.service.getByCondition(pageOptions);
  }
}
```

---

## Lợi ích trong Testing

### Không có Interface
```typescript
// Khó mock
const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  // Phải nhớ tất cả methods
  // Dễ quên method nào đó
};
```

### Có Interface
```typescript
// Dễ mock - TypeScript check đầy đủ methods
const mockService: IUsersService = {
  create: jest.fn().mockResolvedValue(mockUser),
  findAll: jest.fn().mockResolvedValue([mockUser]),
  findOne: jest.fn().mockResolvedValue(mockUser),
  update: jest.fn().mockResolvedValue(mockUser),
  remove: jest.fn().mockResolvedValue({ message: 'Deleted' }),
  findByEmail: jest.fn().mockResolvedValue(mockUser),
  count: jest.fn().mockResolvedValue(10),
  search: jest.fn().mockResolvedValue([mockUser]),
  findByAgeRange: jest.fn().mockResolvedValue([mockUser]),
  findWithPagination: jest.fn().mockResolvedValue({
    users: [mockUser],
    total: 1,
    page: 1,
    totalPages: 1,
  }),
};

// TypeScript báo lỗi nếu thiếu method nào
```

---

## Multiple Implementations

Interface cho phép nhiều implementations:

```typescript
// Interface chung
interface IUsersService {
  findAll(): Promise<User[]>;
}

// Implementation 1: Lấy từ MongoDB
class MongoUsersService implements IUsersService {
  async findAll(): Promise<User[]> {
    return await this.repository.findAll();
  }
}

// Implementation 2: Lấy từ cache
class CachedUsersService implements IUsersService {
  async findAll(): Promise<User[]> {
    const cached = await this.cache.get('users');
    if (cached) return cached;
    
    const users = await this.repository.findAll();
    await this.cache.set('users', users);
    return users;
  }
}

// Implementation 3: Mock cho testing
class MockUsersService implements IUsersService {
  async findAll(): Promise<User[]> {
    return [mockUser1, mockUser2];
  }
}

// Controller không cần biết implementation nào
class UsersController {
  constructor(private service: IUsersService) {}
  // Có thể inject bất kỳ implementation nào
}
```

---

## Best Practices

### 1. Đặt tên Interface
```typescript
// ✅ TỐT: Prefix với I
interface IUsersService { }
interface IUsersRepository { }

// ❌ KHÔNG TỐT: Không rõ ràng
interface UsersService { }
interface Users { }
```

### 2. Interface nên nhỏ và focused
```typescript
// ✅ TỐT: Tách thành nhiều interface nhỏ
interface IUserReader {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User>;
}

interface IUserWriter {
  create(dto: CreateUserDto): Promise<User>;
  update(id: string, dto: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
}

// Service implement cả 2
class UsersService implements IUserReader, IUserWriter { }

// ❌ KHÔNG TỐT: Interface quá lớn
interface IUsersService {
  // 50 methods...
}
```

### 3. Return types rõ ràng
```typescript
// ✅ TỐT
interface IUsersService {
  findOne(id: string): Promise<User>;           // Luôn có User
  findByEmail(email: string): Promise<User | null>; // Có thể null
}

// ❌ KHÔNG TỐT
interface IUsersService {
  findOne(id: string): Promise<any>;  // any = mất type safety
}
```

---

## Khi nào dùng Interface?

### ✅ NÊN DÙNG khi:
- Project lớn, nhiều developers
- Cần test kỹ càng
- Có thể có nhiều implementations
- Muốn enforce contract chặt chẽ

### ❌ KHÔNG CẦN khi:
- Project nhỏ, cá nhân
- Chỉ có 1 implementation duy nhất
- Không cần test nhiều

---

## Tóm tắt

✅ **Interface:**
- Hợp đồng định nghĩa methods
- Type safety
- Dễ test và mock
- Hỗ trợ multiple implementations

🎯 **Cấu trúc:**
```
interfaces/
├── users-service.interface.ts
└── users-repository.interface.ts

users.service.ts implements IUsersService
users.repository.ts implements IUsersRepository
```

📚 **Best Practices:**
- Prefix với I (IUsersService)
- Interface nhỏ và focused
- Return types rõ ràng
- Document bằng comments

Chúc bạn học tốt! 🚀
