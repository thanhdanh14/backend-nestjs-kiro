# 🛡️ Hướng dẫn Validation trong NestJS

## Validation là gì?

**Validation** = Kiểm tra dữ liệu đầu vào có hợp lệ không trước khi xử lý.

**Tại sao cần validation?**
- Bảo vệ ứng dụng khỏi dữ liệu sai/độc hại
- Đảm bảo dữ liệu đúng format trước khi lưu database
- Trả về lỗi rõ ràng cho client

**Ví dụ:**
```
❌ Không có validation:
   Client gửi: { "name": "", "email": "invalid", "age": -5 }
   → Server lưu dữ liệu sai vào database

✅ Có validation:
   Client gửi: { "name": "", "email": "invalid", "age": -5 }
   → Server kiểm tra và trả lỗi: "Tên phải có ít nhất 2 ký tự"
```

---

## Cài đặt

Đã thêm 2 packages vào `package.json`:
```json
"class-validator": "^0.14.0",    // Thư viện validation
"class-transformer": "^0.5.1"    // Chuyển đổi dữ liệu
```

**Chạy lệnh cài đặt:**
```bash
npm install
```

---

## Cấu hình Global Validation Pipe

### 📄 src/main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
// Import ValidationPipe - công cụ validation của NestJS

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ==================== BẬT VALIDATION TOÀN CỤC ====================
  app.useGlobalPipes(
    // useGlobalPipes = áp dụng pipe cho tất cả routes
    
    new ValidationPipe({
      // Tạo ValidationPipe với các options
      
      whitelist: true,
      // whitelist: true = Tự động loại bỏ các field không có trong DTO
      // Ví dụ: Client gửi { name: "An", hacker: "bad" }
      //        → Chỉ giữ lại { name: "An" }
      
      forbidNonWhitelisted: true,
      // forbidNonWhitelisted: true = Báo lỗi nếu có field không hợp lệ
      // Ví dụ: Client gửi { name: "An", hacker: "bad" }
      //        → Trả lỗi: "property hacker should not exist"
      
      transform: true,
      // transform: true = Tự động chuyển đổi kiểu dữ liệu
      // Ví dụ: URL param "5" (string) → 5 (number)
    }),
  );
  
  await app.listen(3000);
  console.log(`Application is running on: http://localhost:3000`);
}
bootstrap();
```

**Tóm tắt:**
- `whitelist: true` - Lọc bỏ field không mong muốn
- `forbidNonWhitelisted: true` - Báo lỗi nếu có field lạ
- `transform: true` - Tự động convert kiểu dữ liệu

---

## Validation Decorators

### 📄 src/users/dto/create-user.dto.ts

```typescript
import {
  IsString,      // Kiểm tra có phải string không
  IsEmail,       // Kiểm tra email hợp lệ
  IsOptional,    // Field không bắt buộc
  IsInt,         // Kiểm tra số nguyên
  MinLength,     // Độ dài tối thiểu
  MaxLength,     // Độ dài tối đa
  Min,           // Giá trị tối thiểu
  Max,           // Giá trị tối đa
} from 'class-validator';

export class CreateUserDto {
  
  // ==================== VALIDATION CHO NAME ====================
  @IsString({ message: 'Tên phải là chuỗi ký tự' })
  // @IsString() = Kiểm tra name phải là string
  // message = Thông báo lỗi tùy chỉnh (nếu không có sẽ dùng message mặc định)
  
  @MinLength(2, { message: 'Tên phải có ít nhất 2 ký tự' })
  // @MinLength(2) = Độ dài tối thiểu 2 ký tự
  // Ví dụ: "A" → Lỗi, "An" → OK
  
  @MaxLength(50, { message: 'Tên không được quá 50 ký tự' })
  // @MaxLength(50) = Độ dài tối đa 50 ký tự
  
  name: string;

  // ==================== VALIDATION CHO EMAIL ====================
  @IsEmail({}, { message: 'Email không hợp lệ' })
  // @IsEmail() = Kiểm tra format email
  // Ví dụ: "test" → Lỗi, "test@gmail.com" → OK
  // {} = options (để mặc định)
  
  email: string;

  // ==================== VALIDATION CHO AGE ====================
  @IsOptional()
  // @IsOptional() = Field này không bắt buộc
  // Nếu không gửi age → OK
  // Nếu gửi age → phải pass các validation bên dưới
  
  @IsInt({ message: 'Tuổi phải là số nguyên' })
  // @IsInt() = Kiểm tra phải là số nguyên (integer)
  // Ví dụ: 25 → OK, 25.5 → Lỗi, "25" → Lỗi
  
  @Min(1, { message: 'Tuổi phải lớn hơn 0' })
  // @Min(1) = Giá trị tối thiểu là 1
  // Ví dụ: 0 → Lỗi, -5 → Lỗi, 1 → OK
  
  @Max(150, { message: 'Tuổi không được quá 150' })
  // @Max(150) = Giá trị tối đa là 150
  
  age?: number;
  // ?: number = TypeScript syntax cho optional
}
```

**Thứ tự decorators quan trọng:**
1. `@IsOptional()` phải đặt đầu tiên (nếu có)
2. Các decorator khác đặt sau

---

### 📄 src/users/dto/update-user.dto.ts

```typescript
import {
  IsString,
  IsEmail,
  IsOptional,
  IsInt,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class UpdateUserDto {
  // Tất cả fields đều optional vì khi update có thể chỉ đổi 1 field
  
  @IsOptional()
  @IsString({ message: 'Tên phải là chuỗi ký tự' })
  @MinLength(2, { message: 'Tên phải có ít nhất 2 ký tự' })
  @MaxLength(50, { message: 'Tên không được quá 50 ký tự' })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @IsOptional()
  @IsInt({ message: 'Tuổi phải là số nguyên' })
  @Min(1, { message: 'Tuổi phải lớn hơn 0' })
  @Max(150, { message: 'Tuổi không được quá 150' })
  age?: number;
}
```

**Lưu ý:** Tất cả fields trong UpdateUserDto đều có `@IsOptional()` vì khi update không bắt buộc gửi tất cả.

---

## Các Validation Decorators phổ biến

### String Validators
```typescript
@IsString()                          // Phải là string
@MinLength(5)                        // Độ dài tối thiểu
@MaxLength(20)                       // Độ dài tối đa
@Length(5, 20)                       // Độ dài từ 5-20
@Contains('hello')                   // Phải chứa "hello"
@IsAlpha()                           // Chỉ chữ cái (a-z, A-Z)
@IsAlphanumeric()                    // Chữ cái + số
@IsLowercase()                       // Chữ thường
@IsUppercase()                       // Chữ hoa
```

### Number Validators
```typescript
@IsNumber()                          // Phải là số
@IsInt()                             // Phải là số nguyên
@Min(0)                              // Giá trị tối thiểu
@Max(100)                            // Giá trị tối đa
@IsPositive()                        // Số dương
@IsNegative()                        // Số âm
```

### Boolean Validators
```typescript
@IsBoolean()                         // Phải là true/false
```

### Date Validators
```typescript
@IsDate()                            // Phải là Date object
@MinDate(new Date('2020-01-01'))     // Ngày tối thiểu
@MaxDate(new Date('2025-12-31'))     // Ngày tối đa
```

### Email & URL Validators
```typescript
@IsEmail()                           // Email hợp lệ
@IsUrl()                             // URL hợp lệ
```

### Array Validators
```typescript
@IsArray()                           // Phải là mảng
@ArrayMinSize(1)                     // Mảng có ít nhất 1 phần tử
@ArrayMaxSize(10)                    // Mảng tối đa 10 phần tử
```

### Other Validators
```typescript
@IsOptional()                        // Field không bắt buộc
@IsNotEmpty()                        // Không được rỗng
@IsEnum(UserRole)                    // Phải thuộc enum
@IsUUID()                            // Phải là UUID
@IsPhoneNumber('VN')                 // Số điện thoại Việt Nam
```

---

## Test Validation

### ✅ Request hợp lệ

**POST** `/users`
```json
{
  "name": "Nguyễn Văn An",
  "email": "an@example.com",
  "age": 25
}
```

**Response:** 201 Created
```json
{
  "id": 1,
  "name": "Nguyễn Văn An",
  "email": "an@example.com",
  "age": 25,
  "createdAt": "2024-11-13T10:00:00.000Z",
  "updatedAt": "2024-11-13T10:00:00.000Z"
}
```

---

### ❌ Lỗi: Tên quá ngắn

**POST** `/users`
```json
{
  "name": "A",
  "email": "an@example.com",
  "age": 25
}
```

**Response:** 400 Bad Request
```json
{
  "statusCode": 400,
  "message": [
    "Tên phải có ít nhất 2 ký tự"
  ],
  "error": "Bad Request"
}
```

---

### ❌ Lỗi: Email không hợp lệ

**POST** `/users`
```json
{
  "name": "Nguyễn Văn An",
  "email": "invalid-email",
  "age": 25
}
```

**Response:** 400 Bad Request
```json
{
  "statusCode": 400,
  "message": [
    "Email không hợp lệ"
  ],
  "error": "Bad Request"
}
```

---

### ❌ Lỗi: Tuổi âm

**POST** `/users`
```json
{
  "name": "Nguyễn Văn An",
  "email": "an@example.com",
  "age": -5
}
```

**Response:** 400 Bad Request
```json
{
  "statusCode": 400,
  "message": [
    "Tuổi phải lớn hơn 0"
  ],
  "error": "Bad Request"
}
```

---

### ❌ Lỗi: Nhiều lỗi cùng lúc

**POST** `/users`
```json
{
  "name": "A",
  "email": "invalid",
  "age": -5
}
```

**Response:** 400 Bad Request
```json
{
  "statusCode": 400,
  "message": [
    "Tên phải có ít nhất 2 ký tự",
    "Email không hợp lệ",
    "Tuổi phải lớn hơn 0"
  ],
  "error": "Bad Request"
}
```

---

### ❌ Lỗi: Field không hợp lệ (forbidNonWhitelisted)

**POST** `/users`
```json
{
  "name": "Nguyễn Văn An",
  "email": "an@example.com",
  "age": 25,
  "hacker": "bad data"
}
```

**Response:** 400 Bad Request
```json
{
  "statusCode": 400,
  "message": [
    "property hacker should not exist"
  ],
  "error": "Bad Request"
}
```

---

## Flow hoạt động của Validation

```
1. Client gửi request:
   POST /users
   Body: { "name": "A", "email": "invalid" }

2. Request đến NestJS

3. ValidationPipe kiểm tra dữ liệu theo CreateUserDto:
   - name = "A" → Lỗi (MinLength 2)
   - email = "invalid" → Lỗi (IsEmail)

4. ValidationPipe throw BadRequestException

5. NestJS tự động trả response lỗi 400:
   {
     "statusCode": 400,
     "message": [
       "Tên phải có ít nhất 2 ký tự",
       "Email không hợp lệ"
     ],
     "error": "Bad Request"
   }

6. Request KHÔNG đến Controller/Service
   → Bảo vệ ứng dụng khỏi dữ liệu sai
```

**Quan trọng:** Nếu validation fail, request sẽ KHÔNG đến controller/service!

---

## Validation nâng cao

### 1. Custom Validation Message với biến

```typescript
@MinLength(2, { 
  message: 'Tên phải có ít nhất $constraint1 ký tự (hiện tại: $value)' 
})
name: string;
```

- `$constraint1` = giá trị constraint (2)
- `$value` = giá trị thực tế user gửi

---

### 2. Nested Object Validation

```typescript
import { ValidateNested, Type } from 'class-validator';

class AddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;
}

class CreateUserDto {
  @IsString()
  name: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}
```

---

### 3. Custom Validator

```typescript
import { 
  registerDecorator, 
  ValidationOptions, 
  ValidatorConstraint, 
  ValidatorConstraintInterface 
} from 'class-validator';

// Tạo custom validator kiểm tra tên không chứa số
@ValidatorConstraint({ name: 'isNameValid', async: false })
class IsNameValidConstraint implements ValidatorConstraintInterface {
  validate(name: string) {
    return !/\d/.test(name); // Trả về false nếu có số
  }

  defaultMessage() {
    return 'Tên không được chứa số';
  }
}

// Tạo decorator
function IsNameValid(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNameValidConstraint,
    });
  };
}

// Sử dụng
class CreateUserDto {
  @IsNameValid()
  name: string;
}
```

---

## Bài tập thực hành

### Bài 1: Thêm validation cho phone
Thêm field `phone` vào User với validation:
- Bắt buộc phải có
- Phải là số điện thoại Việt Nam hợp lệ
- Hint: `@IsPhoneNumber('VN')`

### Bài 2: Validation cho password
Tạo DTO cho đăng ký user với password:
- Password tối thiểu 8 ký tự
- Phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số
- Hint: `@Matches()` với regex

### Bài 3: Validation cho enum
Thêm field `role` với giá trị chỉ được là 'admin', 'user', 'guest':
- Hint: Tạo enum và dùng `@IsEnum()`

### Bài 4: Array validation
Tạo endpoint nhận mảng tags:
- Tags phải là mảng string
- Mỗi tag từ 2-20 ký tự
- Tối thiểu 1 tag, tối đa 5 tags

---

## Tóm tắt

✅ **Đã học:**
- Cài đặt class-validator và class-transformer
- Cấu hình ValidationPipe toàn cục
- Sử dụng các decorator validation phổ biến
- Tùy chỉnh message lỗi
- Test validation với các trường hợp khác nhau

🎯 **Lợi ích:**
- Bảo vệ ứng dụng khỏi dữ liệu sai
- Code sạch hơn (không cần if/else kiểm tra thủ công)
- Lỗi rõ ràng, dễ debug
- Tự động document API (khi dùng Swagger)

📚 **Bước tiếp theo:**
- Tích hợp database (TypeORM + PostgreSQL)
- Exception handling nâng cao
- Authentication & Authorization

Chúc bạn học tốt! 🚀
