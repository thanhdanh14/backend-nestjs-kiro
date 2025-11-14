# 🎓 NestJS Complete Learning Guide

Chúc mừng! Bạn đã hoàn thành một project NestJS đầy đủ với tất cả tính năng chuyên nghiệp! 🎉

---

## 📚 Những gì đã học

### 1. ✅ Validation (class-validator)
**File:** `VALIDATION_GUIDE.md`

**Nội dung:**
- Kiểm tra dữ liệu đầu vào
- Decorators: @IsString(), @IsEmail(), @MinLength(), etc.
- ValidationPipe global
- Custom validation messages

**Ví dụ:**
```typescript
export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;
  
  @IsEmail()
  email: string;
}
```

---

### 2. ✅ MongoDB Integration
**File:** `MONGODB_GUIDE.md`

**Nội dung:**
- Kết nối MongoDB với Mongoose
- Schema definition
- CRUD operations
- Query operators
- Aggregation pipeline

**Ví dụ:**
```typescript
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;
  
  @Prop({ required: true, unique: true })
  email: string;
}
```

---

### 3. ✅ Repository Pattern
**File:** `REPOSITORY_PATTERN_GUIDE.md`

**Nội dung:**
- Tách logic database ra khỏi Service
- Reusability
- Testability
- Separation of concerns

**Kiến trúc:**
```
Controller → Service → Repository → Model → Database
```

**Ví dụ:**
```typescript
@Injectable()
export class UsersRepository {
  async findById(id: string): Promise<User | null> {
    return await this.userModel.findById(id).exec();
  }
}
```

---

### 4. ✅ Interface Pattern
**File:** `INTERFACE_GUIDE.md`

**Nội dung:**
- Type safety
- Contract definition
- Dễ mock khi test
- Dependency Inversion Principle

**Ví dụ:**
```typescript
export interface IUsersService {
  create(dto: CreateUserDto): Promise<User>;
  findAll(): Promise<User[]>;
}

export class UsersService implements IUsersService {
  // Phải implement đầy đủ methods
}
```

---

### 5. ✅ Authentication (JWT)
**File:** `AUTH_GUIDE.md`

**Nội dung:**
- JWT tokens
- Passport strategies (Local, JWT)
- Hash password với bcrypt
- Guards (JwtAuthGuard, LocalAuthGuard)
- Protected routes

**Flow:**
```
Register → Hash password → Save to DB → Generate JWT
Login → Validate password → Generate JWT
Protected Route → Verify JWT → Allow/Deny
```

**Ví dụ:**
```typescript
@Get('profile')
@UseGuards(JwtAuthGuard)
async getProfile(@CurrentUser() user: User) {
  return user;
}
```

---

### 6. ✅ Authorization (Roles)
**File:** `AUTHORIZATION_GUIDE.md`

**Nội dung:**
- Role-Based Access Control (RBAC)
- Enum roles (USER, ADMIN, MODERATOR)
- @Roles() decorator
- RolesGuard
- Permission checking

**Ví dụ:**
```typescript
@Get('admin-only')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
async adminOnly() {
  return { message: 'Admin only' };
}
```

---

### 7. ✅ Refresh Token
**File:** `REFRESH_TOKEN_GUIDE.md`

**Nội dung:**
- Access token (15 phút)
- Refresh token (7 ngày)
- Token rotation
- Logout mechanism

**Flow:**
```
Login → { access_token, refresh_token }
Access token expired → Use refresh_token
POST /auth/refresh → New { access_token, refresh_token }
```

**Ví dụ:**
```typescript
@Post('refresh')
async refresh(@Body() dto: RefreshTokenDto) {
  return await this.authService.refreshTokens(userId, dto.refresh_token);
}
```

---

### 8. ✅ Swagger Documentation
**File:** `SWAGGER_GUIDE.md`

**Nội dung:**
- Auto-generate API docs
- Interactive UI
- Test API trong browser
- @ApiTags(), @ApiOperation(), @ApiResponse()

**Truy cập:**
```
http://localhost:3000/api
```

**Ví dụ:**
```typescript
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async login() { }
}
```

---

### 9. ✅ Rate Limiting
**File:** `RATE_LIMITING_GUIDE.md`

**Nội dung:**
- Giới hạn requests/time
- Chống DDoS, brute force
- ThrottlerModule
- Custom limits per route

**Ví dụ:**
```typescript
ThrottlerModule.forRoot([{
  ttl: 60000,  // 60 seconds
  limit: 10,   // 10 requests
}])

@Post('login')
@Throttle({ default: { limit: 5, ttl: 60000 } })
async login() { }
```

---

## 🏗️ Kiến trúc Project

```
src/
├── auth/                          # Authentication & Authorization
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts
│   ├── dto/
│   │   ├── login.dto.ts
│   │   ├── register.dto.ts
│   │   ├── refresh-token.dto.ts
│   │   └── assign-role.dto.ts
│   ├── enums/
│   │   └── role.enum.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── local-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── interfaces/
│   │   └── auth-service.interface.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   └── local.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
│
├── users/                         # User Management
│   ├── dto/
│   │   ├── create-user.dto.ts
│   │   └── update-user.dto.ts
│   ├── interfaces/
│   │   ├── users-service.interface.ts
│   │   └── users-repository.interface.ts
│   ├── schemas/
│   │   └── user.schema.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.repository.ts
│   └── users.module.ts
│
├── app.controller.ts
├── app.service.ts
├── app.module.ts
└── main.ts
```

---

## 🚀 Chạy Project

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Chạy MongoDB
```bash
# Local
mongod

# Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 3. Chạy server
```bash
npm run start:dev
```

### 4. Truy cập
- **API:** http://localhost:3000
- **Swagger Docs:** http://localhost:3000/api

---

## 📖 API Endpoints

### Authentication
```
POST   /auth/register      - Đăng ký
POST   /auth/login         - Đăng nhập
POST   /auth/refresh       - Refresh token
POST   /auth/logout        - Đăng xuất
GET    /auth/profile       - Lấy profile (Protected)
GET    /auth/admin-only    - Admin only (Protected + Role)
```

### Users
```
POST   /users              - Tạo user (Admin only)
GET    /users              - Lấy tất cả users (Admin/Moderator)
GET    /users/:id          - Lấy user theo ID (Authenticated)
PATCH  /users/:id          - Cập nhật user (Owner/Admin)
DELETE /users/:id          - Xóa user (Admin only)
```

---

## 🧪 Test Flow

### 1. Đăng ký
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@test.com",
    "password": "Password123"
  }'
```

**Response:**
```json
{
  "user": { ... },
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci..."
}
```

### 2. Đăng nhập
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "Password123"
  }'
```

### 3. Truy cập Protected Route
```bash
curl http://localhost:3000/auth/profile \
  -H "Authorization: Bearer <access_token>"
```

### 4. Refresh Token
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<refresh_token>"
  }'
```

### 5. Test Rate Limiting
```bash
# Gửi 11 requests liên tiếp
for i in {1..11}; do
  curl http://localhost:3000/auth/profile \
    -H "Authorization: Bearer <token>"
done
# Request thứ 11 sẽ bị 429 Too Many Requests
```

---

## 🎯 Best Practices đã áp dụng

### 1. Security
- ✅ Hash password với bcrypt
- ✅ JWT với expiration
- ✅ Refresh token rotation
- ✅ Rate limiting
- ✅ Input validation
- ✅ Role-based authorization

### 2. Code Quality
- ✅ Repository Pattern
- ✅ Interface Pattern
- ✅ Separation of Concerns
- ✅ Type Safety (TypeScript)
- ✅ Error Handling
- ✅ Consistent naming

### 3. Documentation
- ✅ Swagger API docs
- ✅ Code comments
- ✅ Learning guides
- ✅ Examples

### 4. Scalability
- ✅ Modular architecture
- ✅ Dependency Injection
- ✅ Stateless authentication
- ✅ Database indexing

---

## 📚 Bước tiếp theo (Advanced)

### 1. Testing
- Unit tests (Jest)
- Integration tests
- E2E tests
- Test coverage

### 2. Advanced Features
- File upload (Multer)
- Email service (Nodemailer)
- Caching (Redis)
- Queue (Bull)
- WebSocket (Socket.io)
- GraphQL

### 3. DevOps
- Docker containerization
- CI/CD pipeline
- Environment variables
- Logging (Winston)
- Monitoring (Prometheus)

### 4. Database
- Migrations
- Seeding
- Transactions
- Relationships (populate)
- Full-text search

### 5. Security
- Helmet (HTTP headers)
- CORS configuration
- CSRF protection
- SQL injection prevention
- XSS protection

---

## 🎓 Tổng kết

Bạn đã học được:
- ✅ 9 concepts chuyên nghiệp
- ✅ 50+ files code
- ✅ 10+ design patterns
- ✅ Production-ready practices

**Project này bao gồm:**
- Authentication & Authorization
- Database integration
- API documentation
- Security best practices
- Scalable architecture

**Bạn có thể:**
- Xây dựng REST API chuyên nghiệp
- Implement authentication/authorization
- Thiết kế database schema
- Document API với Swagger
- Apply design patterns

---

## 🌟 Lời khuyên

1. **Practice:** Code lại từ đầu để nhớ lâu
2. **Experiment:** Thử thêm features mới
3. **Read docs:** NestJS docs rất tốt
4. **Build projects:** Áp dụng vào project thực tế
5. **Share:** Chia sẻ kiến thức với người khác

---

## 📞 Resources

- **NestJS Docs:** https://docs.nestjs.com
- **MongoDB Docs:** https://docs.mongodb.com
- **JWT.io:** https://jwt.io
- **Swagger:** https://swagger.io

---

Chúc bạn thành công trên con đường trở thành NestJS Developer! 🚀

**Happy Coding!** 💻✨
