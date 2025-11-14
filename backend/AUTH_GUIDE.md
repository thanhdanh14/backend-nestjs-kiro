# 🔐 Authentication & Authorization với JWT

## Authentication là gì?

**Authentication** = Xác thực danh tính (Bạn là ai?)
**Authorization** = Phân quyền (Bạn được làm gì?)

### Ví dụ thực tế
```
Authentication: Đăng nhập vào Facebook → Xác thực bạn là ai
Authorization: Admin có thể xóa bài viết, User thường không được
```

---

## JWT (JSON Web Token) là gì?

**JWT** là chuỗi token dùng để xác thực user mà không cần lưu session trên server.

### Cấu trúc JWT
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NTRhYmMxMjMiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20ifQ.abc123xyz
[Header].[Payload].[Signature]
```

**1. Header** (màu đỏ):
```json
{
  "alg": "HS256",  // Thuật toán mã hóa
  "typ": "JWT"     // Loại token
}
```

**2. Payload** (màu tím):
```json
{
  "sub": "654abc123",           // User ID
  "email": "test@test.com",     // Email
  "name": "Nguyễn Văn An",      // Tên
  "iat": 1699876543,            // Issued at (thời gian tạo)
  "exp": 1699962943             // Expiration (thời gian hết hạn)
}
```

**3. Signature** (màu xanh):
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret_key
)
```

### Đặc điểm JWT
- ✅ Stateless (không cần lưu session trên server)
- ✅ Có thể decode để xem payload (nhưng không thể sửa)
- ✅ Verify bằng signature
- ❌ Không thể revoke (thu hồi) trước khi hết hạn
- ❌ Payload có thể đọc được (không lưu thông tin nhạy cảm)

---

## Flow Authentication

### 1. Đăng ký (Register)
```
Client                          Server
  |                               |
  |  POST /auth/register          |
  |  { name, email, password }    |
  |------------------------------>|
  |                               | 1. Validate dữ liệu
  |                               | 2. Kiểm tra email đã tồn tại?
  |                               | 3. Hash password với bcrypt
  |                               | 4. Lưu user vào database
  |                               | 5. Tạo JWT token
  |  { user, access_token }       |
  |<------------------------------|
  |                               |
```

### 2. Đăng nhập (Login)
```
Client                          Server
  |                               |
  |  POST /auth/login             |
  |  { email, password }          |
  |------------------------------>|
  |                               | 1. Tìm user theo email
  |                               | 2. So sánh password với bcrypt
  |                               | 3. Nếu đúng → tạo JWT token
  |  { access_token }             |
  |<------------------------------|
  |                               |
  | Lưu token vào localStorage    |
  | hoặc cookie                   |
```

### 3. Truy cập Protected Route
```
Client                          Server
  |                               |
  |  GET /auth/profile            |
  |  Header: Authorization:       |
  |  Bearer <token>               |
  |------------------------------>|
  |                               | 1. Lấy token từ header
  |                               | 2. Verify token với secret key
  |                               | 3. Decode payload → lấy user ID
  |                               | 4. Tìm user trong database
  |                               | 5. Attach user vào request
  |  { user data }                |
  |<------------------------------|
  |                               |
```

---

## Giải thích từng file

### 📄 package.json - Dependencies

```json
{
  "dependencies": {
    "@nestjs/jwt": "^10.1.0",        // JWT module của NestJS
    "@nestjs/passport": "^10.0.0",   // Passport integration
    "bcrypt": "^5.1.1",               // Hash password
    "passport": "^0.6.0",             // Authentication middleware
    "passport-jwt": "^4.0.1",         // JWT strategy cho Passport
    "passport-local": "^1.0.0"        // Local strategy (email/password)
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.0",
    "@types/passport-jwt": "^3.0.9",
    "@types/passport-local": "^1.0.35"
  }
}
```

---

### 📄 src/users/schemas/user.schema.ts - Thêm Password

```typescript
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string; // ✅ Thêm field password
  // Lưu password đã hash, KHÔNG BAO GIỜ lưu password gốc

  @Prop({ min: 1, max: 150 })
  age?: number;

  @Prop()
  phone?: string;
}
```

---

### 📄 src/auth/dto/register.dto.ts - DTO Đăng ký

```typescript
export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password phải có ít nhất 8 ký tự' })
  @MaxLength(50)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password phải chứa chữ hoa, chữ thường và số',
  })
  // Regex kiểm tra password mạnh:
  //   - (?=.*[A-Z]) = Có ít nhất 1 chữ hoa
  //   - (?=.*[a-z]) = Có ít nhất 1 chữ thường
  //   - ((?=.*\d)|(?=.*\W+)) = Có ít nhất 1 số hoặc ký tự đặc biệt
  password: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(150)
  age?: number;

  @IsOptional()
  @IsString()
  phone?: string;
}
```

**Ví dụ password hợp lệ:**
- ✅ `Password123`
- ✅ `MyPass@2024`
- ❌ `password` (thiếu chữ hoa và số)
- ❌ `PASSWORD` (thiếu chữ thường và số)
- ❌ `Pass1` (quá ngắn)

---

### 📄 src/auth/auth.service.ts - Business Logic

```typescript
@Injectable()
export class AuthService implements IAuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  // ==================== ĐĂNG KÝ ====================
  async register(registerDto: RegisterDto) {
    // 1. Kiểm tra email đã tồn tại chưa
    const existing = await this.usersRepository.findByEmail(registerDto.email);
    if (existing) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // 2. Hash password với bcrypt
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    // bcrypt.hash(password, saltRounds)
    //   - password: "MyPassword123"
    //   - saltRounds: 10 (độ phức tạp)
    //   - Kết quả: "$2b$10$abc123xyz..." (60 ký tự)
    //
    // Cùng password nhưng hash ra khác nhau mỗi lần:
    //   "MyPassword123" → "$2b$10$abc..."
    //   "MyPassword123" → "$2b$10$xyz..." (khác nhau!)
    //
    // Lý do: bcrypt tự động thêm salt (muối) ngẫu nhiên

    // 3. Tạo user với password đã hash
    const user = await this.usersRepository.create({
      ...registerDto,
      password: hashedPassword, // Lưu password đã hash
    });

    // 4. Tạo JWT token
    const access_token = await this.generateToken(user);

    // 5. Trả về user (không có password) và token
    const { password: _, ...userWithoutPassword } = user.toObject();
    return {
      user: userWithoutPassword,
      access_token,
    };
  }

  // ==================== VALIDATE USER ====================
  async validateUser(email: string, password: string): Promise<User | null> {
    // Method này được gọi bởi LocalStrategy khi login
    
    // 1. Tìm user theo email
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      return null; // Email không tồn tại
    }

    // 2. So sánh password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    // bcrypt.compare(plainPassword, hashedPassword)
    //   - plainPassword: "MyPassword123" (user nhập vào)
    //   - hashedPassword: "$2b$10$abc..." (trong database)
    //   - Trả về: true nếu khớp, false nếu không
    //
    // bcrypt tự động extract salt từ hashedPassword và so sánh

    if (!isPasswordValid) {
      return null; // Password sai
    }

    // 3. Trả về user (không có password)
    const { password: _, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword as User;
  }

  // ==================== LOGIN ====================
  async login(user: User) {
    // User đã được validate bởi LocalStrategy
    // Chỉ cần tạo token
    const access_token = await this.generateToken(user);
    return { access_token };
  }

  // ==================== GENERATE TOKEN ====================
  private async generateToken(user: User): Promise<string> {
    // Payload = Dữ liệu lưu trong JWT
    const payload = {
      sub: user._id,      // sub = subject (ID của user)
      email: user.email,
      name: user.name,
    };

    // Sign JWT
    return this.jwtService.sign(payload);
    // Kết quả: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NTRhYmMxMjMifQ.abc123"
    //
    // Token này:
    //   - Có thể decode để xem payload
    //   - Không thể sửa (signature sẽ invalid)
    //   - Hết hạn sau 1 ngày (config trong AuthModule)
  }
}
```

---

### 📄 src/auth/strategies/local.strategy.ts - Login Strategy

```typescript
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  // LocalStrategy = Strategy cho login với email/password
  
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',    // Dùng email thay vì username
      passwordField: 'password',
    });
  }

  // validate() được Passport tự động gọi khi login
  async validate(email: string, password: string): Promise<User> {
    // 1. Passport lấy email/password từ request body
    // 2. Gọi method này để validate
    
    const user = await this.authService.validateUser(email, password);
    
    if (!user) {
      // Email hoặc password sai
      throw new UnauthorizedException('Email hoặc password không đúng');
    }
    
    // 3. Trả về user
    // Passport tự động attach user vào request.user
    return user;
  }
}
```

---

### 📄 src/auth/strategies/jwt.strategy.ts - JWT Strategy

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // JwtStrategy = Strategy để verify JWT token
  
  constructor(private usersRepository: UsersRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Lấy JWT từ header: Authorization: Bearer <token>
      
      ignoreExpiration: false,
      // false = Reject token đã hết hạn
      
      secretOrKey: 'YOUR_SECRET_KEY_CHANGE_THIS_IN_PRODUCTION',
      // Secret key để verify (phải giống với key trong JwtModule)
    });
  }

  // validate() được Passport tự động gọi sau khi verify token
  async validate(payload: any) {
    // payload = Dữ liệu đã decode từ JWT
    // { sub: '654abc123', email: 'test@test.com', name: 'An' }
    
    // 1. Lấy user từ database
    const user = await this.usersRepository.findById(payload.sub);
    
    if (!user) {
      // User không tồn tại (có thể đã bị xóa)
      throw new UnauthorizedException('User không tồn tại');
    }
    
    // 2. Trả về user
    // Passport tự động attach user vào request.user
    return user;
  }
}
```

---

### 📄 src/auth/guards/jwt-auth.guard.ts - JWT Guard

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Guard để protect routes
}

// Sử dụng:
// @Get('profile')
// @UseGuards(JwtAuthGuard)  // ← Protect route này
// getProfile(@CurrentUser() user: User) {
//   return user;
// }
```

**Flow khi dùng JwtAuthGuard:**
```
1. Client gửi request với header:
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

2. JwtAuthGuard lấy token từ header

3. Verify token với secret key
   - Nếu invalid → 401 Unauthorized
   - Nếu expired → 401 Unauthorized
   - Nếu valid → tiếp tục

4. Gọi JwtStrategy.validate(payload)

5. JwtStrategy lấy user từ database

6. Attach user vào request.user

7. Controller method được thực thi
```

---

### 📄 src/auth/auth.controller.ts - API Endpoints

```typescript
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ==================== ĐĂNG KÝ ====================
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    // POST /auth/register
    // Body: { name, email, password, age?, phone? }
    // Response: { user, access_token }
    return await this.authService.register(registerDto);
  }

  // ==================== ĐĂNG NHẬP ====================
  @Post('login')
  @UseGuards(LocalAuthGuard)
  // LocalAuthGuard validate email/password
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @CurrentUser() user: User) {
    // POST /auth/login
    // Body: { email, password }
    // Response: { access_token }
    
    // @CurrentUser() lấy user từ request
    // (đã được validate bởi LocalAuthGuard)
    return await this.authService.login(user);
  }

  // ==================== LẤY PROFILE ====================
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  // JwtAuthGuard kiểm tra JWT token
  async getProfile(@CurrentUser() user: User) {
    // GET /auth/profile
    // Header: Authorization: Bearer <token>
    // Response: { user data }
    
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
```

---

## Test Authentication

### 1. Đăng ký
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nguyễn Văn An",
    "email": "an@test.com",
    "password": "Password123",
    "age": 25
  }'
```

**Response:**
```json
{
  "user": {
    "_id": "654abc123...",
    "name": "Nguyễn Văn An",
    "email": "an@test.com",
    "age": 25,
    "createdAt": "2024-11-13T10:00:00.000Z",
    "updatedAt": "2024-11-13T10:00:00.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Đăng nhập
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "an@test.com",
    "password": "Password123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Lấy profile (Protected)
```bash
curl http://localhost:3000/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "_id": "654abc123...",
  "name": "Nguyễn Văn An",
  "email": "an@test.com",
  "age": 25
}
```

### 4. Lỗi: Không có token
```bash
curl http://localhost:3000/auth/profile
```

**Response:** 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 5. Lỗi: Token invalid
```bash
curl http://localhost:3000/auth/profile \
  -H "Authorization: Bearer invalid_token"
```

**Response:** 401 Unauthorized

---

## Protect Routes

### Protect toàn bộ controller
```typescript
@Controller('users')
@UseGuards(JwtAuthGuard) // ← Protect tất cả routes
export class UsersController {
  @Get()
  findAll() { } // Protected

  @Get(':id')
  findOne() { } // Protected
}
```

### Protect từng route
```typescript
@Controller('users')
export class UsersController {
  @Get()
  findAll() { } // Public

  @Get('me')
  @UseGuards(JwtAuthGuard) // ← Chỉ protect route này
  getMe() { } // Protected
}
```

---

## Decode JWT Token

Bạn có thể decode JWT tại: https://jwt.io

**Ví dụ token:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NTRhYmMxMjMiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJuYW1lIjoiTmd1eeG7hW4gVsSDbiDDgW4iLCJpYXQiOjE2OTk4NzY1NDMsImV4cCI6MTY5OTk2Mjk0M30.abc123xyz
```

**Decode ra:**
```json
{
  "sub": "654abc123",
  "email": "test@test.com",
  "name": "Nguyễn Văn An",
  "iat": 1699876543,
  "exp": 1699962943
}
```

**Lưu ý:** Payload có thể đọc được → KHÔNG lưu thông tin nhạy cảm (password, credit card, etc.)

---

## Best Practices

### 1. Secret Key
```typescript
// ❌ KHÔNG TỐT: Hardcode secret key
JwtModule.register({
  secret: 'my_secret_key',
})

// ✅ TỐT: Dùng environment variable
JwtModule.register({
  secret: process.env.JWT_SECRET,
})
```

### 2. Token Expiration
```typescript
// Short-lived access token
JwtModule.register({
  secret: process.env.JWT_SECRET,
  signOptions: { expiresIn: '15m' }, // 15 phút
})

// Kết hợp với refresh token (advanced)
```

### 3. Không lưu password trong response
```typescript
// ✅ TỐT
const { password, ...userWithoutPassword } = user.toObject();
return userWithoutPassword;

// ❌ KHÔNG TỐT
return user; // Có password
```

### 4. Hash password với bcrypt
```typescript
// ✅ TỐT
const hashed = await bcrypt.hash(password, 10);

// ❌ KHÔNG TỐT
const hashed = crypto.createHash('md5').update(password).digest('hex');
// MD5 không an toàn
```

---

## Tóm tắt

✅ **Đã học:**
- JWT là gì và cách hoạt động
- Hash password với bcrypt
- Passport strategies (Local, JWT)
- Guards để protect routes
- Custom decorator @CurrentUser()

🎯 **Flow:**
```
Register → Hash password → Save to DB → Generate JWT
Login → Validate password → Generate JWT
Protected Route → Verify JWT → Get user → Allow access
```

📚 **Bước tiếp theo:**
- Refresh token
- Role-based authorization (Admin, User)
- OAuth2 (Google, Facebook login)
- Two-factor authentication (2FA)

Chúc bạn học tốt! 🚀
