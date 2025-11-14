# 📚 Hướng dẫn học NestJS từng bước

## Mục lục
1. [Kiến trúc NestJS](#kiến-trúc-nestjs)
2. [Giải thích từng file](#giải-thích-từng-file)
3. [Flow hoạt động](#flow-hoạt-động)
4. [Bài tập thực hành](#bài-tập-thực-hành)

---

## Kiến trúc NestJS

```
Request từ client (Postman, Browser)
    ↓
Controller (nhận request, gọi service)
    ↓
Service (xử lý logic, thao tác dữ liệu)
    ↓
Response trả về client
```

**3 thành phần chính:**
- **Module**: Tổ chức code thành các nhóm chức năng
- **Controller**: Xử lý HTTP requests (GET, POST, PUT, DELETE)
- **Service**: Chứa business logic, xử lý dữ liệu

---

## Giải thích từng file

### 📄 src/main.ts - Entry Point (Điểm khởi đầu)

```typescript
import { NestFactory } from '@nestjs/core';
// Import NestFactory - công cụ để tạo ứng dụng NestJS

import { AppModule } from './app.module';
// Import AppModule - module gốc của ứng dụng

async function bootstrap() {
  // Hàm khởi động ứng dụng (async vì cần đợi server start)
  
  const app = await NestFactory.create(AppModule);
  // Tạo ứng dụng NestJS từ AppModule
  // await = đợi cho đến khi tạo xong
  
  await app.listen(3000);
  // Khởi động server ở port 3000
  // Server sẽ lắng nghe requests tại http://localhost:3000
  
  console.log(`Application is running on: http://localhost:3000`);
  // In thông báo ra console
}

bootstrap();
// Gọi hàm bootstrap để chạy ứng dụng
```

**Tóm tắt:** File này khởi động server NestJS ở port 3000.

---

### 📄 src/app.module.ts - Module Gốc

```typescript
import { Module } from '@nestjs/common';
// Import decorator @Module từ NestJS

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
// Import các controller, service, và module cần dùng

@Module({
  // @Module là decorator - đánh dấu class này là một Module
  
  imports: [UsersModule],
  // imports: Danh sách các module khác mà module này sử dụng
  // UsersModule chứa tất cả logic về users
  
  controllers: [AppController],
  // controllers: Danh sách các controller trong module này
  // AppController xử lý route gốc "/"
  
  providers: [AppService],
  // providers: Danh sách các service (có thể inject vào controller)
  // AppService chứa logic cho AppController
})
export class AppModule {}
// Export class rỗng - logic nằm trong decorator @Module
```

**Tóm tắt:** Module gốc kết nối tất cả các module, controller, service lại với nhau.

---

### 📄 src/users/users.module.ts - Users Module

```typescript
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  // Đăng ký UsersController - xử lý routes /users
  
  providers: [UsersService],
  // Đăng ký UsersService - NestJS sẽ tự động tạo instance
  // và inject vào controller khi cần
  
  exports: [UsersService],
  // exports: Cho phép module khác sử dụng UsersService
  // (nếu không export thì chỉ dùng được trong module này)
})
export class UsersModule {}
```

**Tóm tắt:** Module quản lý tất cả về users (controller + service).

---

### 📄 src/users/entities/user.entity.ts - User Model

```typescript
export class User {
  // Định nghĩa cấu trúc dữ liệu của User
  
  id: number;           // ID duy nhất của user
  name: string;         // Tên user (bắt buộc)
  email: string;        // Email user (bắt buộc)
  age?: number;         // Tuổi user (optional - dấu ? nghĩa là không bắt buộc)
  createdAt: Date;      // Thời gian tạo
  updatedAt: Date;      // Thời gian cập nhật lần cuối
}
```

**Tóm tắt:** Định nghĩa User có những thuộc tính gì.

---

### 📄 src/users/dto/create-user.dto.ts - DTO tạo user

```typescript
export class CreateUserDto {
  // DTO = Data Transfer Object
  // Định nghĩa dữ liệu client gửi lên khi TẠO user
  
  name: string;      // Tên (bắt buộc)
  email: string;     // Email (bắt buộc)
  age?: number;      // Tuổi (optional)
}
```

**Tại sao cần DTO?**
- Kiểm soát dữ liệu đầu vào
- Client chỉ gửi name, email, age
- Không cho phép client tự đặt id, createdAt, updatedAt

---

### 📄 src/users/dto/update-user.dto.ts - DTO cập nhật user

```typescript
export class UpdateUserDto {
  // Định nghĩa dữ liệu khi CẬP NHẬT user
  
  name?: string;     // Tất cả đều optional (dấu ?)
  email?: string;    // Vì khi update có thể chỉ đổi 1 field
  age?: number;
}
```

**Tóm tắt:** Khi update, client có thể gửi 1 hoặc nhiều field tùy ý.

---

### 📄 src/users/users.controller.ts - Controller

Đây là file QUAN TRỌNG NHẤT - xử lý HTTP requests!

```typescript
import {
  Controller,    // Decorator đánh dấu class là controller
  Get,          // Decorator cho HTTP GET
  Post,         // Decorator cho HTTP POST
  Body,         // Lấy dữ liệu từ request body
  Patch,        // Decorator cho HTTP PATCH
  Param,        // Lấy parameter từ URL
  Delete,       // Decorator cho HTTP DELETE
  HttpCode,     // Đặt HTTP status code
  HttpStatus,   // Các status code chuẩn
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
// @Controller('users') = tất cả routes trong class này bắt đầu bằng /users
export class UsersController {
  
  constructor(private readonly usersService: UsersService) {}
  // Constructor - NestJS tự động inject UsersService vào đây
  // private readonly = biến chỉ dùng trong class này và không thể thay đổi
  // Giờ có thể dùng this.usersService để gọi các method

  // ==================== TẠO USER ====================
  @Post()
  // @Post() = route này xử lý POST request
  // URL đầy đủ: POST /users
  
  @HttpCode(HttpStatus.CREATED)
  // Trả về status code 201 (Created) thay vì 200 (OK)
  
  create(@Body() createUserDto: CreateUserDto) {
    // @Body() = lấy dữ liệu từ request body
    // createUserDto: CreateUserDto = dữ liệu phải theo cấu trúc CreateUserDto
    
    return this.usersService.create(createUserDto);
    // Gọi method create() của UsersService
    // Service xử lý logic, controller chỉ nhận request và trả response
  }

  // ==================== LẤY TẤT CẢ USERS ====================
  @Get()
  // @Get() = route này xử lý GET request
  // URL đầy đủ: GET /users
  
  findAll() {
    return this.usersService.findAll();
    // Gọi service để lấy tất cả users
  }

  // ==================== LẤY 1 USER THEO ID ====================
  @Get(':id')
  // @Get(':id') = route có parameter động
  // URL đầy đủ: GET /users/1, GET /users/2, ...
  // :id là placeholder - giá trị thực sẽ lấy từ URL
  
  findOne(@Param('id') id: string) {
    // @Param('id') = lấy giá trị của :id từ URL
    // Ví dụ: GET /users/5 → id = "5" (string)
    
    return this.usersService.findOne(+id);
    // +id = convert string thành number
    // "5" → 5
  }

  // ==================== CẬP NHẬT USER ====================
  @Patch(':id')
  // @Patch(':id') = route này xử lý PATCH request
  // URL đầy đủ: PATCH /users/1
  // PATCH = cập nhật một phần (khác với PUT = thay thế toàn bộ)
  
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    // Nhận 2 thứ:
    // 1. @Param('id') = ID từ URL
    // 2. @Body() = dữ liệu cập nhật từ request body
    
    return this.usersService.update(+id, updateUserDto);
    // Gọi service để cập nhật user
  }

  // ==================== XÓA USER ====================
  @Delete(':id')
  // @Delete(':id') = route này xử lý DELETE request
  // URL đầy đủ: DELETE /users/1
  
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
    // Gọi service để xóa user
  }
}
```

**Tóm tắt Controller:**
- Nhận HTTP requests
- Lấy dữ liệu từ URL params hoặc body
- Gọi Service để xử lý
- Trả response về client

---

### 📄 src/users/users.service.ts - Service (Business Logic)

Đây là nơi xử lý LOGIC thực sự!

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
// Injectable = decorator cho phép inject service vào nơi khác
// NotFoundException = exception khi không tìm thấy dữ liệu

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
// @Injectable() = đánh dấu class này có thể được inject
export class UsersService {
  
  private users: User[] = [];
  // Mảng lưu trữ users (trong memory - mất khi restart)
  // private = chỉ dùng trong class này
  // User[] = mảng các object User
  
  private currentId = 1;
  // Biến đếm ID - mỗi user mới sẽ có ID tăng dần
  
  // ==================== TẠO USER ====================
  create(createUserDto: CreateUserDto): User {
    // Nhận CreateUserDto, trả về User
    
    const newUser: User = {
      // Tạo object user mới
      
      id: this.currentId++,
      // Gán ID = currentId, sau đó tăng currentId lên 1
      // Ví dụ: user đầu tiên id=1, user thứ 2 id=2, ...
      
      ...createUserDto,
      // Spread operator - copy tất cả properties từ createUserDto
      // Tương đương: name: createUserDto.name, email: createUserDto.email, ...
      
      createdAt: new Date(),
      // Thời gian tạo = thời gian hiện tại
      
      updatedAt: new Date(),
      // Thời gian cập nhật = thời gian hiện tại
    };
    
    this.users.push(newUser);
    // Thêm user mới vào mảng users
    
    return newUser;
    // Trả về user vừa tạo
  }

  // ==================== LẤY TẤT CẢ USERS ====================
  findAll(): User[] {
    // Trả về mảng User[]
    
    return this.users;
    // Đơn giản: trả về toàn bộ mảng users
  }

  // ==================== LẤY 1 USER THEO ID ====================
  findOne(id: number): User {
    // Nhận id (number), trả về User
    
    const user = this.users.find((user) => user.id === id);
    // Array.find() = tìm phần tử đầu tiên thỏa điều kiện
    // (user) => user.id === id = arrow function kiểm tra id
    // Ví dụ: tìm user có id = 5
    
    if (!user) {
      // Nếu không tìm thấy user (user = undefined)
      
      throw new NotFoundException(`User với ID ${id} không tồn tại`);
      // Throw exception - NestJS tự động trả về response lỗi 404
      // Client sẽ nhận: { "statusCode": 404, "message": "User với ID 5 không tồn tại" }
    }
    
    return user;
    // Trả về user tìm được
  }

  // ==================== CẬP NHẬT USER ====================
  update(id: number, updateUserDto: UpdateUserDto): User {
    // Nhận id và dữ liệu cập nhật
    
    const userIndex = this.users.findIndex((user) => user.id === id);
    // Array.findIndex() = tìm vị trí (index) của phần tử trong mảng
    // Trả về -1 nếu không tìm thấy
    
    if (userIndex === -1) {
      // Nếu không tìm thấy user
      throw new NotFoundException(`User với ID ${id} không tồn tại`);
    }

    const updatedUser = {
      // Tạo object user đã cập nhật
      
      ...this.users[userIndex],
      // Copy tất cả properties từ user cũ
      
      ...updateUserDto,
      // Ghi đè các properties từ updateUserDto
      // Ví dụ: user cũ {name: "A", email: "a@test.com"}
      //        updateUserDto {name: "B"}
      //        kết quả: {name: "B", email: "a@test.com"}
      
      updatedAt: new Date(),
      // Cập nhật thời gian
    };
    
    this.users[userIndex] = updatedUser;
    // Thay thế user cũ bằng user mới trong mảng
    
    return updatedUser;
    // Trả về user đã cập nhật
  }

  // ==================== XÓA USER ====================
  remove(id: number): { message: string } {
    // Trả về object có property message
    
    const userIndex = this.users.findIndex((user) => user.id === id);
    // Tìm vị trí user cần xóa
    
    if (userIndex === -1) {
      throw new NotFoundException(`User với ID ${id} không tồn tại`);
    }

    this.users.splice(userIndex, 1);
    // Array.splice(vị trí, số lượng) = xóa phần tử khỏi mảng
    // splice(userIndex, 1) = xóa 1 phần tử tại vị trí userIndex
    
    return { message: `Đã xóa user với ID ${id}` };
    // Trả về thông báo thành công
  }
}
```

**Tóm tắt Service:**
- Chứa toàn bộ business logic
- Thao tác với dữ liệu (CRUD)
- Throw exception khi có lỗi
- Controller gọi Service, Service xử lý và trả kết quả

---

## Flow hoạt động

### Ví dụ: Tạo user mới

```
1. Client gửi request:
   POST http://localhost:3000/users
   Body: { "name": "An", "email": "an@test.com", "age": 25 }

2. NestJS nhận request → tìm route phù hợp
   → Tìm thấy UsersController.create()

3. Controller nhận dữ liệu:
   @Body() createUserDto = { name: "An", email: "an@test.com", age: 25 }

4. Controller gọi Service:
   this.usersService.create(createUserDto)

5. Service xử lý:
   - Tạo user mới với ID tự động
   - Thêm createdAt, updatedAt
   - Lưu vào mảng users
   - Trả về user mới

6. Controller nhận kết quả từ Service và trả về client

7. Client nhận response:
   {
     "id": 1,
     "name": "An",
     "email": "an@test.com",
     "age": 25,
     "createdAt": "2024-11-13T10:00:00.000Z",
     "updatedAt": "2024-11-13T10:00:00.000Z"
   }
```

---

## Các khái niệm quan trọng

### 1. Decorator (@)
- Là function đặc biệt đánh dấu class/method/parameter
- Ví dụ: `@Controller()`, `@Get()`, `@Body()`

### 2. Dependency Injection (DI)
```typescript
constructor(private readonly usersService: UsersService) {}
```
- NestJS tự động tạo instance của UsersService
- Inject (tiêm) vào controller
- Không cần `new UsersService()` thủ công

### 3. Arrow Function
```typescript
(user) => user.id === id
```
- Cú pháp ngắn gọn của function
- Tương đương: `function(user) { return user.id === id; }`

### 4. Spread Operator (...)
```typescript
{ ...createUserDto }
```
- Copy tất cả properties từ object
- Giúp code ngắn gọn hơn

### 5. Optional Parameter (?)
```typescript
age?: number
```
- Dấu `?` = không bắt buộc
- Có thể có hoặc không

---

## Bài tập thực hành

### Bài 1: Thêm field mới
Thêm field `phone` (số điện thoại) vào User
- Cập nhật User entity
- Cập nhật CreateUserDto và UpdateUserDto
- Test API

### Bài 2: Tìm user theo email
Thêm endpoint: `GET /users/email/:email`
- Tạo method trong Service
- Tạo route trong Controller
- Test với Postman

### Bài 3: Đếm số lượng users
Thêm endpoint: `GET /users/count`
- Trả về số lượng users hiện có
- Hint: `this.users.length`

### Bài 4: Xóa tất cả users
Thêm endpoint: `DELETE /users`
- Xóa toàn bộ users
- Hint: `this.users = []`

---

## Câu hỏi thường gặp

**Q: Tại sao cần tách Controller và Service?**
A: Để code dễ maintain, test, và tái sử dụng. Controller chỉ xử lý HTTP, Service xử lý logic.

**Q: Dữ liệu lưu ở đâu?**
A: Hiện tại lưu trong memory (mảng). Sau này sẽ dùng database thật.

**Q: Tại sao dùng PATCH thay vì PUT?**
A: PATCH = cập nhật một phần, PUT = thay thế toàn bộ. PATCH linh hoạt hơn.

**Q: Exception là gì?**
A: Là lỗi được throw ra. NestJS tự động bắt và trả về response lỗi cho client.

---

## Bước tiếp theo

1. ✅ Hiểu cơ bản về NestJS
2. 🔜 Thêm validation (class-validator)
3. 🔜 Tích hợp database (TypeORM + PostgreSQL)
4. 🔜 Authentication (JWT, Passport)
5. 🔜 File upload
6. 🔜 Testing

Chúc bạn học tốt! 🚀
