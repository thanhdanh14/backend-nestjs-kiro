# 📚 Swagger API Documentation

## Swagger là gì?

**Swagger** (OpenAPI) = Tool tự động tạo documentation cho API

### Lợi ích
- ✅ Tự động generate docs từ code
- ✅ Interactive UI để test API
- ✅ Không cần viết docs thủ công
- ✅ Luôn sync với code

---

## Setup Swagger

### 1. Cài đặt
```bash
npm install @nestjs/swagger
```

### 2. Cấu hình trong main.ts
```typescript
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('NestJS Learning API')
  .setDescription('API documentation')
  .setVersion('1.0')
  .addTag('auth', 'Authentication endpoints')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
    'JWT-auth',
  )
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api', app, document);
```

### 3. Truy cập
```
http://localhost:3000/api
```

---

## Decorators

### Controller Level
```typescript
@ApiTags('auth')
@Controller('auth')
export class AuthController { }
```

### Method Level
```typescript
@Post('login')
@ApiOperation({ summary: 'Đăng nhập' })
@ApiResponse({ status: 200, description: 'Thành công' })
@ApiResponse({ status: 401, description: 'Sai email/password' })
async login() { }
```

### DTO Level
```typescript
export class RegisterDto {
  @ApiProperty({ 
    example: 'user@example.com',
    description: 'Email người dùng'
  })
  @IsEmail()
  email: string;
}
```

### Protected Routes
```typescript
@Get('profile')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
async getProfile() { }
```

---

## Test API trong Swagger

1. Mở http://localhost:3000/api
2. Click "Authorize" button
3. Nhập JWT token: `Bearer <your_token>`
4. Click "Authorize"
5. Test các endpoints

---

## Best Practices

1. **Luôn thêm @ApiTags()** cho controller
2. **Thêm @ApiOperation()** cho mỗi endpoint
3. **Document tất cả responses** với @ApiResponse()
4. **Thêm examples** trong @ApiProperty()
5. **Protect routes** với @ApiBearerAuth()
