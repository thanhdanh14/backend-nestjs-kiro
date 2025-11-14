# 🍃 Hướng dẫn MongoDB với NestJS

## MongoDB là gì?

**MongoDB** là NoSQL database lưu trữ dữ liệu dạng JSON (document-based).

**So sánh với SQL:**
```
SQL (PostgreSQL, MySQL):
- Lưu dữ liệu trong tables (bảng)
- Có rows và columns
- Cần định nghĩa schema chặt chẽ

MongoDB:
- Lưu dữ liệu trong collections (tập hợp)
- Có documents (tài liệu) dạng JSON
- Schema linh hoạt hơn
```

**Ví dụ document trong MongoDB:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Nguyễn Văn An",
  "email": "an@example.com",
  "age": 25,
  "createdAt": "2024-11-13T10:00:00.000Z",
  "updatedAt": "2024-11-13T10:00:00.000Z"
}
```

---

## Cài đặt MongoDB

### Cách 1: MongoDB Local (Khuyến nghị cho học tập)

**Windows:**
1. Tải MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Cài đặt với các tùy chọn mặc định
3. MongoDB sẽ chạy tại `mongodb://localhost:27017`

**Kiểm tra MongoDB đã chạy:**
```bash
# Mở MongoDB Shell
mongosh

# Hoặc kiểm tra service
# Windows: Services → MongoDB Server
```

### Cách 2: MongoDB Atlas (Cloud - Miễn phí)

1. Đăng ký tại: https://www.mongodb.com/cloud/atlas/register
2. Tạo free cluster
3. Lấy connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/nestjs-learning
   ```
4. Thay vào `app.module.ts`

### Cách 3: Docker (Nhanh nhất)

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

---

## Cài đặt packages

Đã thêm vào `package.json`:
```json
"@nestjs/mongoose": "^10.0.0",  // NestJS wrapper cho Mongoose
"mongoose": "^7.5.0"             // MongoDB ODM
```

**Chạy lệnh:**
```bash
npm install
```

---

## Kiến trúc MongoDB trong NestJS

```
app.module.ts
  ↓ (Kết nối MongoDB)
MongooseModule.forRoot()
  ↓
users.module.ts
  ↓ (Đăng ký Schema)
MongooseModule.forFeature([UserSchema])
  ↓
users.service.ts
  ↓ (Inject Model)
@InjectModel(User.name)
  ↓
Thao tác với MongoDB
```

---

## Giải thích từng file

### 📄 src/app.module.ts - Kết nối MongoDB

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
// Import MongooseModule để kết nối MongoDB

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/nestjs-learning'),
    // forRoot() = Kết nối đến MongoDB
    // 
    // Connection string format:
    // mongodb://[host]:[port]/[database_name]
    //
    // mongodb://localhost:27017/nestjs-learning
    //   - localhost = Server address
    //   - 27017 = MongoDB default port
    //   - nestjs-learning = Database name (tự động tạo nếu chưa có)
    //
    // Nếu dùng MongoDB Atlas:
    // 'mongodb+srv://username:password@cluster.mongodb.net/nestjs-learning'
    
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

**Lưu ý:**
- Database `nestjs-learning` sẽ tự động được tạo khi có data đầu tiên
- Không cần tạo database thủ công

---

### 📄 src/users/schemas/user.schema.ts - Định nghĩa Schema

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// Prop = Decorator cho properties
// Schema = Decorator cho class
// SchemaFactory = Tạo schema từ class

import { HydratedDocument } from 'mongoose';
// HydratedDocument = Type của document sau khi query từ MongoDB

export type UserDocument = HydratedDocument<User>;
// UserDocument = Type cho document User
// Dùng trong Service để type-safe

@Schema({ timestamps: true })
// @Schema() = Đánh dấu class này là MongoDB schema
// timestamps: true = Tự động thêm createdAt và updatedAt
//   - createdAt: Thời gian tạo document
//   - updatedAt: Thời gian cập nhật lần cuối
export class User {
  
  // ==================== NAME FIELD ====================
  @Prop({ required: true })
  // @Prop() = Định nghĩa field trong MongoDB document
  // required: true = Field bắt buộc phải có
  //   → Nếu không có name khi save → MongoDB throw error
  name: string;

  // ==================== EMAIL FIELD ====================
  @Prop({ required: true, unique: true })
  // unique: true = Email phải là duy nhất trong collection
  //   → MongoDB tạo unique index cho field này
  //   → Nếu insert email trùng → Error code 11000
  email: string;

  // ==================== AGE FIELD ====================
  @Prop({ min: 1, max: 150 })
  // min, max = Validation ở database level
  //   → MongoDB kiểm tra giá trị trước khi save
  // Không có required → Field này optional
  age?: number;

  // ==================== PHONE FIELD ====================
  @Prop()
  // Không có options → Field optional, không có validation
  phone?: string;
  
  // Lưu ý: Không cần định nghĩa _id, createdAt, updatedAt
  // MongoDB tự động thêm:
  //   - _id: ObjectId duy nhất
  //   - createdAt, updatedAt: Do timestamps: true
}

// Tạo schema từ class User
export const UserSchema = SchemaFactory.createForClass(User);
// SchemaFactory.createForClass() = Convert class thành Mongoose schema
// UserSchema sẽ được dùng trong UsersModule
```

**MongoDB sẽ tạo collection với cấu trúc:**
```json
{
  "_id": ObjectId("..."),
  "name": "string",
  "email": "string (unique)",
  "age": "number (1-150, optional)",
  "phone": "string (optional)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

### 📄 src/users/users.module.ts - Đăng ký Schema

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      // forFeature() = Đăng ký schema cho module này
      // Mỗi module cần đăng ký schema mà nó sử dụng
      
      { name: User.name, schema: UserSchema },
      // name: User.name = Tên model (sẽ là 'User')
      //   → MongoDB collection name = 'users' (tự động lowercase + thêm 's')
      // schema: UserSchema = Schema definition từ user.schema.ts
      
      // Có thể đăng ký nhiều schema:
      // { name: User.name, schema: UserSchema },
      // { name: Post.name, schema: PostSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

**Tóm tắt:**
- `forRoot()` trong AppModule = Kết nối database
- `forFeature()` trong UsersModule = Đăng ký schema

---

### 📄 src/users/users.service.ts - Thao tác với MongoDB

```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
// InjectModel = Decorator để inject Mongoose model

import { Model } from 'mongoose';
// Model = Type của Mongoose model

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    // @InjectModel(User.name) = Inject User model
    //   - User.name = 'User' (tên model)
    //   - NestJS tự động inject model đã đăng ký trong UsersModule
    // 
    // userModel: Model<UserDocument>
    //   - userModel = Biến để thao tác với collection 'users'
    //   - Model<UserDocument> = Type của model
  ) {}

  // ==================== TẠO USER ====================
  async create(createUserDto: CreateUserDto): Promise<User> {
    // async = Function bất đồng bộ
    //   → Database operations mất thời gian
    //   → Dùng async/await để code dễ đọc hơn callback
    // Promise<User> = Trả về Promise chứa User
    
    try {
      const createdUser = new this.userModel(createUserDto);
      // new this.userModel(data) = Tạo document mới
      //   - Chưa lưu vào database
      //   - Chỉ tạo object trong memory
      
      return await createdUser.save();
      // .save() = Lưu document vào MongoDB
      // await = Đợi cho đến khi lưu xong
      // Trả về document đã lưu (có _id, createdAt, updatedAt)
      
    } catch (error) {
      // Bắt lỗi nếu có
      
      if (error.code === 11000) {
        // Code 11000 = Duplicate key error
        //   → Email đã tồn tại (do unique: true)
        throw new ConflictException('Email đã được sử dụng');
        // ConflictException = HTTP 409 Conflict
      }
      throw error;
      // Throw lại error khác
    }
  }

  // ==================== LẤY TẤT CẢ USERS ====================
  async findAll(): Promise<User[]> {
    return await this.userModel.find().exec();
    // .find() = Tìm tất cả documents trong collection
    //   → Tương đương SQL: SELECT * FROM users
    // .exec() = Thực thi query và trả về Promise
    // Trả về mảng rỗng [] nếu không có user nào
  }

  // ==================== LẤY 1 USER THEO ID ====================
  async findOne(id: string): Promise<User> {
    // id: string = MongoDB _id là string (ObjectId)
    
    const user = await this.userModel.findById(id).exec();
    // .findById(id) = Tìm document theo _id
    //   → Tương đương SQL: SELECT * FROM users WHERE id = ?
    // Trả về null nếu không tìm thấy
    
    if (!user) {
      throw new NotFoundException(`User với ID ${id} không tồn tại`);
      // NotFoundException = HTTP 404 Not Found
    }
    return user;
  }

  // ==================== CẬP NHẬT USER ====================
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          id,                    // ID của document cần update
          updateUserDto,         // Dữ liệu mới
          { new: true }          // Options
        )
        // .findByIdAndUpdate(id, data, options)
        //   → Tìm document theo id và update
        //   → Tương đương SQL: UPDATE users SET ... WHERE id = ?
        // 
        // Options:
        //   - new: true = Trả về document SAU KHI update
        //   - new: false (default) = Trả về document TRƯỚC KHI update
        .exec();

      if (!updatedUser) {
        throw new NotFoundException(`User với ID ${id} không tồn tại`);
      }
      return updatedUser;
      
    } catch (error) {
      if (error.code === 11000) {
        // Email mới bị trùng với user khác
        throw new ConflictException('Email đã được sử dụng');
      }
      throw error;
    }
  }

  // ==================== XÓA USER ====================
  async remove(id: string): Promise<{ message: string }> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    // .findByIdAndDelete(id) = Tìm và xóa document
    //   → Tương đương SQL: DELETE FROM users WHERE id = ?
    // Trả về document đã xóa, hoặc null nếu không tìm thấy
    
    if (!result) {
      throw new NotFoundException(`User với ID ${id} không tồn tại`);
    }
    return { message: `Đã xóa user với ID ${id}` };
  }

  // ==================== TÌM USER THEO EMAIL ====================
  async findByEmail(email: string): Promise<User | null> {
    return await this.userModel.findOne({ email }).exec();
    // .findOne({ field: value }) = Tìm document đầu tiên khớp điều kiện
    //   → Tương đương SQL: SELECT * FROM users WHERE email = ? LIMIT 1
    // { email } = Shorthand cho { email: email }
    // Trả về null nếu không tìm thấy
  }
}
```

---

## Các Mongoose Methods phổ biến

### Create (Tạo)
```typescript
// Cách 1: new + save()
const user = new this.userModel(data);
await user.save();

// Cách 2: create()
await this.userModel.create(data);

// Cách 3: insertMany() - Tạo nhiều documents
await this.userModel.insertMany([data1, data2, data3]);
```

### Read (Đọc)
```typescript
// Tìm tất cả
await this.userModel.find().exec();

// Tìm theo điều kiện
await this.userModel.find({ age: { $gte: 18 } }).exec(); // age >= 18

// Tìm 1 document
await this.userModel.findOne({ email: 'test@test.com' }).exec();

// Tìm theo ID
await this.userModel.findById(id).exec();

// Đếm số lượng
await this.userModel.countDocuments().exec();

// Pagination
await this.userModel.find().skip(10).limit(5).exec(); // Skip 10, lấy 5

// Sort
await this.userModel.find().sort({ createdAt: -1 }).exec(); // -1 = DESC

// Select fields
await this.userModel.find().select('name email').exec(); // Chỉ lấy name và email
```

### Update (Cập nhật)
```typescript
// Update 1 document và trả về document mới
await this.userModel.findByIdAndUpdate(id, data, { new: true }).exec();

// Update 1 document theo điều kiện
await this.userModel.findOneAndUpdate({ email }, data, { new: true }).exec();

// Update nhiều documents
await this.userModel.updateMany({ age: { $lt: 18 } }, { status: 'minor' }).exec();
```

### Delete (Xóa)
```typescript
// Xóa 1 document và trả về document đã xóa
await this.userModel.findByIdAndDelete(id).exec();

// Xóa 1 document theo điều kiện
await this.userModel.findOneAndDelete({ email }).exec();

// Xóa nhiều documents
await this.userModel.deleteMany({ status: 'inactive' }).exec();
```

---

## MongoDB Query Operators

```typescript
// So sánh
{ age: { $eq: 25 } }        // age = 25
{ age: { $ne: 25 } }        // age != 25
{ age: { $gt: 18 } }        // age > 18
{ age: { $gte: 18 } }       // age >= 18
{ age: { $lt: 65 } }        // age < 65
{ age: { $lte: 65 } }       // age <= 65
{ age: { $in: [18, 25, 30] } }  // age IN (18, 25, 30)

// Logic
{ $and: [{ age: { $gte: 18 } }, { age: { $lte: 65 } }] }
{ $or: [{ name: 'An' }, { name: 'Bình' }] }
{ $not: { age: { $lt: 18 } } }

// String
{ name: /^Nguyễn/ }         // Bắt đầu bằng "Nguyễn" (regex)
{ email: { $regex: '@gmail.com$' } }  // Kết thúc bằng "@gmail.com"

// Exists
{ phone: { $exists: true } }  // Có field phone
{ phone: { $exists: false } } // Không có field phone
```

---

## Test với MongoDB

### 1. Tạo user
**POST** `/users`
```json
{
  "name": "Nguyễn Văn An",
  "email": "an@example.com",
  "age": 25
}
```

**Response:**
```json
{
  "_id": "654abc123def456789012345",
  "name": "Nguyễn Văn An",
  "email": "an@example.com",
  "age": 25,
  "createdAt": "2024-11-13T10:00:00.000Z",
  "updatedAt": "2024-11-13T10:00:00.000Z",
  "__v": 0
}
```

**Lưu ý:**
- `_id`: MongoDB ObjectId (24 ký tự hex)
- `__v`: Version key của Mongoose (dùng cho optimistic locking)

### 2. Lỗi: Email trùng
**POST** `/users` (lần 2 với cùng email)
```json
{
  "name": "Người khác",
  "email": "an@example.com",
  "age": 30
}
```

**Response:** 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Email đã được sử dụng",
  "error": "Conflict"
}
```

---

## Kiểm tra dữ liệu trong MongoDB

### Dùng MongoDB Compass (GUI)
1. Tải MongoDB Compass: https://www.mongodb.com/products/compass
2. Connect: `mongodb://localhost:27017`
3. Chọn database `nestjs-learning`
4. Xem collection `users`

### Dùng MongoDB Shell
```bash
# Mở mongosh
mongosh

# Chọn database
use nestjs-learning

# Xem tất cả users
db.users.find()

# Xem user theo email
db.users.findOne({ email: "an@example.com" })

# Đếm số users
db.users.countDocuments()

# Xóa tất cả users
db.users.deleteMany({})
```

---

## Bài tập thực hành

### Bài 1: Tìm users theo tuổi
Thêm endpoint: `GET /users/age/:min/:max`
- Tìm users có tuổi từ min đến max
- Hint: `{ age: { $gte: min, $lte: max } }`

### Bài 2: Pagination
Thêm query params cho `GET /users`:
- `?page=1&limit=10`
- Hint: `.skip((page - 1) * limit).limit(limit)`

### Bài 3: Search
Thêm endpoint: `GET /users/search?q=Nguyen`
- Tìm users có tên chứa keyword
- Hint: `{ name: { $regex: keyword, $options: 'i' } }`

### Bài 4: Soft Delete
Thêm field `deletedAt` và implement soft delete:
- Khi xóa, chỉ set `deletedAt = new Date()`
- `findAll()` chỉ lấy users chưa xóa
- Hint: `{ deletedAt: null }`

---

## Troubleshooting

### Lỗi: MongooseServerSelectionError
```
Không kết nối được MongoDB
```
**Giải pháp:**
- Kiểm tra MongoDB đã chạy chưa
- Kiểm tra connection string đúng chưa
- Kiểm tra firewall/antivirus

### Lỗi: E11000 duplicate key error
```
Email đã tồn tại
```
**Giải pháp:**
- Đã handle trong code (ConflictException)
- Hoặc xóa index: `db.users.dropIndex("email_1")`

### Lỗi: Cast to ObjectId failed
```
ID không hợp lệ
```
**Giải pháp:**
- MongoDB ID phải là 24 ký tự hex
- Validate ID trước khi query

---

## Tóm tắt

✅ **Đã học:**
- Cài đặt và kết nối MongoDB
- Định nghĩa Schema với Mongoose
- CRUD operations với MongoDB
- Handle errors (duplicate key, not found)
- Query operators cơ bản

🎯 **Lợi ích MongoDB:**
- Dễ học, dễ dùng
- Schema linh hoạt
- Performance tốt
- Phù hợp với JavaScript/TypeScript

📚 **Bước tiếp theo:**
- Relationships (populate)
- Indexes và performance
- Aggregation pipeline
- Authentication với JWT

Chúc bạn học tốt! 🚀
