# 🏗️ Repository Pattern trong NestJS

## Repository Pattern là gì?

**Repository Pattern** là design pattern tách logic truy vấn database ra khỏi business logic.

### Kiến trúc KHÔNG có Repository (Trước đây)
```
Controller → Service → Model (Mongoose) → MongoDB
```
- Service trực tiếp dùng Model
- Logic database lẫn lộn với business logic

### Kiến trúc CÓ Repository (Bây giờ)
```
Controller → Service → Repository → Model (Mongoose) → MongoDB
```
- Service chỉ chứa business logic
- Repository chứa TẤT CẢ logic database
- Dễ test, dễ maintain, dễ thay đổi database

---

## Lợi ích của Repository Pattern

### 1. Separation of Concerns (Tách biệt trách nhiệm)
```typescript
// ❌ KHÔNG TỐT: Service làm quá nhiều việc
class UsersService {
  async create(dto) {
    // Business logic
    if (existingUser) throw error;
    
    // Database logic (lẫn lộn)
    const user = new this.userModel(dto);
    return await user.save();
  }
}

// ✅ TỐT: Tách biệt rõ ràng
class UsersService {
  async create(dto) {
    // CHỈ business logic
    if (existingUser) throw error;
    return await this.repository.create(dto);
  }
}

class UsersRepository {
  async create(dto) {
    // CHỈ database logic
    const user = new this.userModel(dto);
    return await user.save();
  }
}
```

### 2. Reusability (Tái sử dụng)
```typescript
// Repository methods có thể dùng ở nhiều nơi
await this.repository.findByEmail(email); // Dùng trong Service
await this.repository.findByEmail(email); // Dùng trong AuthService
await this.repository.findByEmail(email); // Dùng trong AdminService
```

### 3. Testability (Dễ test)
```typescript
// Dễ mock Repository khi test Service
const mockRepository = {
  findById: jest.fn().mockResolvedValue(mockUser),
};

const service = new UsersService(mockRepository);
```

### 4. Flexibility (Linh hoạt)
```typescript
// Dễ thay đổi database mà không ảnh hưởng Service
// Ví dụ: Đổi từ MongoDB sang PostgreSQL
// Chỉ cần thay đổi Repository, Service không đổi gì
```

---

## So sánh Code

### Trước khi có Repository

**users.service.ts:**
```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(dto: CreateUserDto) {
    // Service phải biết chi tiết về Mongoose
    const user = new this.userModel(dto);
    return await user.save();
  }

  async findAll() {
    // Service phải biết cách query MongoDB
    return await this.userModel.find().exec();
  }

  async findById(id: string) {
    // Service phải biết Mongoose methods
    return await this.userModel.findById(id).exec();
  }
}
```

**Vấn đề:**
- Service biết quá nhiều về database
- Khó test (phải mock Model)
- Khó thay đổi database
- Code lặp lại nếu có nhiều Service

---

### Sau khi có Repository

**users.repository.ts:**
```typescript
@Injectable()
export class UsersRepository {
  // Repository chứa TẤT CẢ logic database
  
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const user = new this.userModel(userData);
    return await user.save();
  }

  async findAll(): Promise<User[]> {
    return await this.userModel.find().exec();
  }

  async findById(id: string): Promise<User | null> {
    return await this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userModel.findOne({ email }).exec();
  }

  async updateById(id: string, data: UpdateQuery<User>): Promise<User | null> {
    return await this.userModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
  }

  async deleteById(id: string): Promise<User | null> {
    return await this.userModel.findByIdAndDelete(id).exec();
  }
}
```

**users.service.ts:**
```typescript
@Injectable()
export class UsersService {
  // Service CHỈ chứa business logic
  
  constructor(private readonly repository: UsersRepository) {}

  async create(dto: CreateUserDto): Promise<User> {
    // Business logic: Kiểm tra email trùng
    const existing = await this.repository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email đã tồn tại');
    }

    // Gọi Repository để lưu
    return await this.repository.create(dto);
  }

  async findAll(): Promise<User[]> {
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.repository.findById(id);
    
    // Business logic: Throw error nếu không tìm thấy
    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }
    return user;
  }
}
```

**Lợi ích:**
- Service sạch hơn, chỉ lo business logic
- Repository tái sử dụng được
- Dễ test (mock Repository đơn giản hơn)
- Dễ thay đổi database

---

## Giải thích từng file

### 📄 src/users/users.repository.ts

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, UpdateQuery } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersRepository {
  // Repository = Lớp trung gian giữa Service và Database
  // Chứa TẤT CẢ logic truy vấn database
  
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    // Inject Model như trước
  ) {}

  // ==================== CREATE ====================
  async create(userData: Partial<User>): Promise<User> {
    // Partial<User> = Một phần properties của User
    // Không bắt buộc có đầy đủ tất cả fields
    
    const createdUser = new this.userModel(userData);
    return await createdUser.save();
  }

  // ==================== FIND ALL ====================
  async findAll(): Promise<User[]> {
    return await this.userModel.find().exec();
  }

  // ==================== FIND BY ID ====================
  async findById(id: string): Promise<User | null> {
    // Trả về User | null
    // Service sẽ xử lý logic throw error
    return await this.userModel.findById(id).exec();
  }

  // ==================== FIND ONE BY CONDITION ====================
  async findOne(filter: FilterQuery<User>): Promise<User | null> {
    // FilterQuery<User> = Điều kiện query MongoDB
    // Ví dụ: { email: 'test@test.com' }
    //        { age: { $gte: 18 } }
    return await this.userModel.findOne(filter).exec();
  }

  // ==================== FIND BY EMAIL ====================
  async findByEmail(email: string): Promise<User | null> {
    // Method chuyên dụng cho query thường dùng
    return await this.userModel.findOne({ email }).exec();
  }

  // ==================== UPDATE BY ID ====================
  async updateById(
    id: string,
    updateData: UpdateQuery<User>,
  ): Promise<User | null> {
    // UpdateQuery<User> = Dữ liệu update
    // Có thể dùng MongoDB operators: { $set: {...}, $inc: {...} }
    return await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  // ==================== DELETE BY ID ====================
  async deleteById(id: string): Promise<User | null> {
    return await this.userModel.findByIdAndDelete(id).exec();
  }

  // ==================== COUNT ====================
  async count(filter: FilterQuery<User> = {}): Promise<number> {
    // filter = {} (default) = Đếm tất cả
    // filter = { age: { $gte: 18 } } = Đếm users >= 18 tuổi
    return await this.userModel.countDocuments(filter).exec();
  }

  // ==================== PAGINATION ====================
  async findWithPagination(
    filter: FilterQuery<User>,
    page: number = 1,
    limit: number = 10,
  ): Promise<User[]> {
    const skip = (page - 1) * limit;
    // page = 1, limit = 10 → skip = 0 (lấy 10 đầu tiên)
    // page = 2, limit = 10 → skip = 10 (bỏ qua 10 đầu, lấy 10 tiếp)
    
    return await this.userModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }) // -1 = DESC (mới nhất trước)
      .exec();
  }

  // ==================== AGGREGATION ====================
  async findByCondition(filterOptions: FilterQuery<User>): Promise<any[]> {
    // Aggregation = Query phức tạp với nhiều bước
    // Giống ví dụ trong code dự án của bạn
    
    const aggregationPipeline = [
      { $match: filterOptions },
      // $match = Lọc documents theo điều kiện
      
      { $sort: { createdAt: 1, _id: 1 } },
      // $sort = Sắp xếp (1 = ASC, -1 = DESC)
      
      {
        $project: {
          // $project = Chọn fields cần lấy
          _id: 1,      // 1 = Include
          name: 1,
          email: 1,
          age: 1,
          createdAt: 1,
          // Không có phone → phone sẽ không có trong kết quả
        },
      },
    ];

    return await this.userModel.aggregate(aggregationPipeline).exec();
  }

  // ==================== SEARCH ====================
  async searchByName(keyword: string): Promise<User[]> {
    return await this.userModel
      .find({
        name: { $regex: keyword, $options: 'i' },
        // $regex = Tìm kiếm theo pattern
        // $options: 'i' = Case-insensitive
        // Ví dụ: keyword = "nguyen" → Tìm "Nguyen", "NGUYEN", "nguyen"
      })
      .exec();
  }

  // ==================== FIND BY AGE RANGE ====================
  async findByAgeRange(minAge: number, maxAge: number): Promise<User[]> {
    return await this.userModel
      .find({
        age: { $gte: minAge, $lte: maxAge },
        // $gte = Greater than or equal (>=)
        // $lte = Less than or equal (<=)
      })
      .exec();
  }

  // ==================== EXISTS ====================
  async exists(filter: FilterQuery<User>): Promise<boolean> {
    // Kiểm tra có tồn tại document nào thỏa điều kiện không
    const count = await this.userModel.countDocuments(filter).exec();
    return count > 0;
  }
}
```

---

### 📄 src/users/users.service.ts

```typescript
@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) {
    // Inject Repository thay vì Model
    // Service không biết gì về Mongoose/MongoDB
  }

  async create(dto: CreateUserDto): Promise<User> {
    // ========== BUSINESS LOGIC ==========
    // Kiểm tra email đã tồn tại chưa
    const existing = await this.repository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // ========== GỌI REPOSITORY ==========
    // Service không quan tâm Repository lưu như thế nào
    return await this.repository.create(dto);
  }

  async findOne(id: string): Promise<User> {
    // ========== GỌI REPOSITORY ==========
    const user = await this.repository.findById(id);
    
    // ========== BUSINESS LOGIC ==========
    // Throw error nếu không tìm thấy
    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    // ========== BUSINESS LOGIC ==========
    // Nếu update email, kiểm tra email mới có bị trùng không
    if (dto.email) {
      const existing = await this.repository.findByEmail(dto.email);
      
      // Email đã tồn tại và không phải của user hiện tại
      if (existing && existing._id.toString() !== id) {
        throw new ConflictException('Email đã được sử dụng');
      }
    }

    // ========== GỌI REPOSITORY ==========
    const updated = await this.repository.updateById(id, dto);
    
    // ========== BUSINESS LOGIC ==========
    if (!updated) {
      throw new NotFoundException('User không tồn tại');
    }
    return updated;
  }

  // ========== METHODS MỚI ==========
  
  async count(): Promise<number> {
    return await this.repository.count();
  }

  async search(keyword: string): Promise<User[]> {
    return await this.repository.searchByName(keyword);
  }

  async findByAgeRange(min: number, max: number): Promise<User[]> {
    return await this.repository.findByAgeRange(min, max);
  }

  async findWithPagination(page: number = 1, limit: number = 10) {
    const users = await this.repository.findWithPagination({}, page, limit);
    const total = await this.repository.count();
    const totalPages = Math.ceil(total / limit);

    return { users, total, page, totalPages };
  }
}
```

---

## Khi nào dùng Repository Pattern?

### ✅ NÊN DÙNG khi:
- Project lớn, nhiều Service
- Có nhiều queries phức tạp
- Cần test kỹ càng
- Có thể thay đổi database sau này
- Team nhiều người (dễ phân chia công việc)

### ❌ KHÔNG CẦN khi:
- Project nhỏ, đơn giản
- Chỉ có CRUD cơ bản
- Không cần test nhiều
- Chắc chắn không đổi database

---

## Ví dụ thực tế: Aggregation Pipeline

Giống code trong dự án của bạn:

```typescript
// Repository
async findFaqCategories(pageOptions: FaqCategoryPageOptions) {
  const filterOptions = this.generateFilterOptions(pageOptions);
  
  const pipeline = [
    { $match: filterOptions },
    { $sort: { createdAt: 1, _id: 1 } },
    { $project: { _id: 1, nameEn: 1, nameVi: 1, status: 1, createdAt: 1 } },
  ];

  return await this.faqCategoryModel.aggregate(pipeline).exec();
}

// Service
async getFaqCategories(pageOptions: FaqCategoryPageOptions) {
  // Business logic: Validate pageOptions
  if (pageOptions.page < 1) {
    throw new BadRequestException('Page phải >= 1');
  }

  // Gọi Repository
  const rawFaqs = await this.repository.findFaqCategories(pageOptions);
  
  // Business logic: Transform data
  return rawFaqs.map(faq => new FaqCategoryDTO(faq));
}
```

---

## Best Practices

### 1. Repository chỉ trả về data, không throw error
```typescript
// ✅ TỐT
async findById(id: string): Promise<User | null> {
  return await this.userModel.findById(id).exec();
}

// ❌ KHÔNG TỐT
async findById(id: string): Promise<User> {
  const user = await this.userModel.findById(id).exec();
  if (!user) throw new NotFoundException(); // Không nên throw ở Repository
  return user;
}
```

### 2. Service xử lý business logic và errors
```typescript
// ✅ TỐT
async findOne(id: string): Promise<User> {
  const user = await this.repository.findById(id);
  if (!user) {
    throw new NotFoundException(); // Throw ở Service
  }
  return user;
}
```

### 3. Đặt tên methods rõ ràng
```typescript
// ✅ TỐT
findById(id: string)
findByEmail(email: string)
findByAgeRange(min: number, max: number)

// ❌ KHÔNG TỐT
find(id: string)
get(email: string)
search(min: number, max: number)
```

---

## Bài tập thực hành

### Bài 1: Thêm soft delete
Implement soft delete trong Repository:
- Thêm field `deletedAt` vào schema
- `deleteById()` chỉ set `deletedAt = new Date()`
- `findAll()` chỉ lấy users chưa xóa

### Bài 2: Thêm full-text search
Tạo method trong Repository:
- `fullTextSearch(keyword: string)`
- Tìm trong cả name, email, phone

### Bài 3: Thêm statistics
Tạo method trong Repository:
- `getStatistics()` trả về: total users, average age, etc.
- Dùng aggregation pipeline

---

## Tóm tắt

✅ **Repository Pattern:**
- Tách logic database ra khỏi Service
- Service chỉ lo business logic
- Repository chỉ lo database operations

🎯 **Lợi ích:**
- Code sạch hơn, dễ maintain
- Dễ test
- Dễ thay đổi database
- Tái sử dụng code

📚 **Kiến trúc:**
```
Controller → Service → Repository → Model → Database
```

Chúc bạn học tốt! 🚀
