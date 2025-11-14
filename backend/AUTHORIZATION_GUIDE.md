# 🔒 Authorization - Roles & Permissions

## Authorization là gì?

**Authentication** = Xác thực danh tính (Bạn là ai?)
**Authorization** = Phân quyền (Bạn được làm gì?)

### Ví dụ thực tế
```
Facebook:
- Authentication: Đăng nhập → Xác thực bạn là "Nguyễn Văn An"
- Authorization: 
  ✅ Bạn có thể xóa bài viết của mình
  ❌ Bạn KHÔNG thể xóa bài viết của người khác
  ✅ Admin có thể xóa bất kỳ bài viết nào
```

---

## Role-Based Access Control (RBAC)

**RBAC** = Phân quyền dựa trên vai trò (role)

### Các Role trong project
```typescript
enum Role {
  USER = 'user',           // User thường
  ADMIN = 'admin',         // Admin (toàn quyền)
  MODERATOR = 'moderator', // Moderator (kiểm duyệt)
}
```

### Quyền của từng Role
```
USER:
  ✅ Xem profile của mình
  ✅ Cập nhật thông tin của mình
  ❌ Xem danh sách users
  ❌ Xóa users

MODERATOR:
  ✅ Tất cả quyền của USER
  ✅ Xem danh sách users
  ❌ Xóa users

ADMIN:
  ✅ Tất cả quyền của MODERATOR
  ✅ Tạo users
  ✅ Xóa users
  ✅ Gán roles cho users
```

---

## Flow Authorization

```
1. User đăng nhập → Nhận JWT token
   Token chứa: { sub: userId, email, name, roles: ['user'] }

2. User gửi request với token:
   GET /users (Xem danh sách users)
   Header: Authorization: Bearer <token>

3. JwtAuthGuard verify token → Lấy user từ DB
   user = { _id, name, email, roles: ['user'] }

4. RolesGuard kiểm tra quyền:
   - Route yêu cầu: @Roles(Role.ADMIN, Role.MODERATOR)
   - User có roles: ['user']
   - Kết quả: ❌ Không có quyền → 403 Forbidden

5. Nếu user có roles: ['admin']
   - Kết quả: ✅ Có quyền → Cho phép access
```

---

## Giải thích từng file

### 📄 src/auth/enums/role.enum.ts - Định nghĩa Roles

```typescript
export enum Role {
  USER = 'user',           // User thường
  ADMIN = 'admin',         // Admin
  MODERATOR = 'moderator', // Moderator
}

// Enum = Tập hợp các giá trị cố định
// Lợi ích:
//   - Type safety: Không thể gán giá trị sai
//   - Autocomplete trong IDE
//   - Dễ refactor

// Sử dụng:
// const role: Role = Role.ADMIN; // ✅ OK
// const role: Role = 'admin';    // ✅ OK (string literal)
// const role: Role = 'invalid';  // ❌ Error
```

---

### 📄 src/users/schemas/user.schema.ts - Thêm Roles

```typescript
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: [String], enum: Role, default: [Role.USER] })
  // @Prop() options:
  //   - type: [String] = Mảng string
  //   - enum: Role = Chỉ chấp nhận giá trị trong Role enum
  //   - default: [Role.USER] = Mặc định là user thường
  //
  // Ví dụ giá trị hợp lệ:
  //   roles: ['user']
  //   roles: ['admin']
  //   roles: ['admin', 'moderator']
  //   roles: ['user', 'moderator']
  //
  // Ví dụ giá trị KHÔNG hợp lệ:
  //   roles: ['invalid'] → MongoDB reject
  roles: Role[];

  @Prop({ min: 1, max: 150 })
  age?: number;

  @Prop()
  phone?: string;
}
```

**Lưu ý:** User có thể có nhiều roles cùng lúc!

---

### 📄 src/auth/decorators/roles.decorator.ts - Decorator

```typescript
import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';
// Key để lưu metadata

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
// Decorator để đánh dấu route cần roles nào
//
// SetMetadata(key, value) = Lưu metadata vào route
// ...roles = Rest parameter (nhận nhiều tham số)

// Sử dụng:
// @Roles(Role.ADMIN)
// → SetMetadata('roles', [Role.ADMIN])
//
// @Roles(Role.ADMIN, Role.MODERATOR)
// → SetMetadata('roles', [Role.ADMIN, Role.MODERATOR])
```

**Metadata** = Dữ liệu về dữ liệu (data about data)
- Lưu thông tin về route
- RolesGuard sẽ đọc metadata này để kiểm tra quyền

---

### 📄 src/auth/guards/roles.guard.ts - Guard kiểm tra quyền

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  // RolesGuard = Guard kiểm tra user có đủ quyền không
  
  constructor(private reflector: Reflector) {
    // Reflector = Tool để đọc metadata từ decorator
  }

  canActivate(context: ExecutionContext): boolean {
    // canActivate() quyết định cho phép access hay không
    // true = Cho phép, false = Từ chối (403 Forbidden)
    
    // ========== BƯỚC 1: LẤY REQUIRED ROLES ==========
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      ROLES_KEY,
      [
        context.getHandler(),  // Method level
        context.getClass(),    // Class level
      ]
    );
    // getAllAndOverride() = Lấy metadata, ưu tiên method level
    //
    // Ví dụ:
    // @Controller('users')
    // @Roles(Role.ADMIN)              ← Class level
    // class UsersController {
    //   @Get()
    //   @Roles(Role.MODERATOR)        ← Method level (ưu tiên)
    //   findAll() {}
    // }
    // → requiredRoles = [Role.MODERATOR]
    
    // ========== BƯỚC 2: KHÔNG CÓ @Roles() ==========
    if (!requiredRoles) {
      return true; // Không yêu cầu role → Cho phép
    }
    
    // ========== BƯỚC 3: LẤY USER TỪ REQUEST ==========
    const { user } = context.switchToHttp().getRequest();
    // user đã được attach bởi JwtAuthGuard
    
    // ========== BƯỚC 4: KIỂM TRA QUYỀN ==========
    return requiredRoles.some((role) => user.roles?.includes(role));
    // some() = Trả về true nếu có ít nhất 1 phần tử thỏa điều kiện
    // includes() = Kiểm tra mảng có chứa phần tử không
    //
    // Ví dụ:
    //   requiredRoles = [Role.ADMIN, Role.MODERATOR]
    //   user.roles = [Role.USER]
    //   → some() check:
    //     - Role.ADMIN in [Role.USER]? → false
    //     - Role.MODERATOR in [Role.USER]? → false
    //   → Kết quả: false (không có quyền)
    //
    //   user.roles = [Role.ADMIN]
    //   → some() check:
    //     - Role.ADMIN in [Role.ADMIN]? → true
    //   → Kết quả: true (có quyền)
  }
}
```

**Thứ tự Guards quan trọng:**
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
// 1. JwtAuthGuard: Verify token, lấy user
// 2. RolesGuard: Kiểm tra user có role phù hợp không
```

---

### 📄 src/auth/auth.controller.ts - Ví dụ sử dụng

```typescript
@Controller('auth')
export class AuthController {
  
  // ==================== PUBLIC ROUTE ====================
  @Get('public')
  // Không có @UseGuards() → Public
  async publicRoute() {
    return { message: 'Ai cũng truy cập được' };
  }

  // ==================== AUTHENTICATED ROUTE ====================
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  // Chỉ cần login (có token) là được
  // Không yêu cầu role cụ thể
  async getProfile(@CurrentUser() user: User) {
    return user;
  }

  // ==================== ADMIN ONLY ====================
  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  // Chỉ ADMIN mới access được
  async adminOnly() {
    return { message: 'Chào mừng Admin!' };
  }

  // ==================== ADMIN OR MODERATOR ====================
  @Get('admin-or-moderator')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  // ADMIN hoặc MODERATOR đều access được
  async adminOrModerator() {
    return { message: 'Chào mừng Admin hoặc Moderator!' };
  }
}
```

---

### 📄 src/users/users.controller.ts - Protect CRUD

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
// Protect toàn bộ controller
export class UsersController {
  
  // ==================== TẠO USER (ADMIN ONLY) ====================
  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // ==================== LẤY TẤT CẢ USERS ====================
  @Get()
  @Roles(Role.ADMIN, Role.MODERATOR)
  // ADMIN hoặc MODERATOR
  findAll() {
    return this.usersService.findAll();
  }

  // ==================== LẤY USER THEO ID ====================
  @Get(':id')
  // Không có @Roles() → Chỉ cần login
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // ==================== XÓA USER (ADMIN ONLY) ====================
  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
```

---

## Test Authorization

### 1. Đăng ký user thường
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "User Thường",
    "email": "user@test.com",
    "password": "Password123"
  }'
```

**Response:**
```json
{
  "user": {
    "_id": "654abc123",
    "name": "User Thường",
    "email": "user@test.com",
    "roles": ["user"]  ← Mặc định là user
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. User thường truy cập route ADMIN
```bash
curl http://localhost:3000/auth/admin-only \
  -H "Authorization: Bearer <user_token>"
```

**Response:** 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### 3. Tạo Admin (Thủ công trong database)
```javascript
// MongoDB Shell hoặc Compass
db.users.updateOne(
  { email: "admin@test.com" },
  { $set: { roles: ["admin"] } }
)
```

### 4. Admin truy cập route ADMIN
```bash
curl http://localhost:3000/auth/admin-only \
  -H "Authorization: Bearer <admin_token>"
```

**Response:** 200 OK
```json
{
  "message": "Chào mừng Admin!",
  "user": "Admin User"
}
```

### 5. Moderator truy cập route ADMIN OR MODERATOR
```bash
curl http://localhost:3000/auth/admin-or-moderator \
  -H "Authorization: Bearer <moderator_token>"
```

**Response:** 200 OK
```json
{
  "message": "Chào mừng Admin hoặc Moderator!",
  "user": "Moderator User",
  "roles": ["moderator"]
}
```

---

## Assign Roles (Gán quyền)

### Tạo endpoint assign roles

```typescript
// users.controller.ts
@Patch(':id/roles')
@Roles(Role.ADMIN)
// Chỉ ADMIN mới gán roles được
async assignRoles(
  @Param('id') id: string,
  @Body() assignRoleDto: AssignRoleDto,
) {
  return await this.usersService.assignRoles(id, assignRoleDto.roles);
}
```

### Test assign roles
```bash
curl -X PATCH http://localhost:3000/users/654abc123/roles \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "roles": ["admin", "moderator"]
  }'
```

---

## Advanced: Permission-Based Authorization

Ngoài RBAC, có thể dùng **Permission-Based** (chi tiết hơn):

```typescript
enum Permission {
  CREATE_USER = 'create:user',
  READ_USER = 'read:user',
  UPDATE_USER = 'update:user',
  DELETE_USER = 'delete:user',
  
  CREATE_POST = 'create:post',
  READ_POST = 'read:post',
  UPDATE_POST = 'update:post',
  DELETE_POST = 'delete:post',
}

// Mapping roles → permissions
const rolePermissions = {
  [Role.USER]: [
    Permission.READ_USER,
    Permission.READ_POST,
  ],
  [Role.MODERATOR]: [
    Permission.READ_USER,
    Permission.READ_POST,
    Permission.UPDATE_POST,
    Permission.DELETE_POST,
  ],
  [Role.ADMIN]: [
    ...Object.values(Permission), // Tất cả permissions
  ],
};
```

---

## Best Practices

### 1. Principle of Least Privilege
```typescript
// ✅ TỐT: Mặc định là role thấp nhất
@Prop({ type: [String], enum: Role, default: [Role.USER] })
roles: Role[];

// ❌ KHÔNG TỐT: Mặc định là admin
@Prop({ type: [String], enum: Role, default: [Role.ADMIN] })
roles: Role[];
```

### 2. Kiểm tra quyền ở nhiều layer
```typescript
// Layer 1: Guard (Controller level)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)

// Layer 2: Service level
async deleteUser(userId: string, currentUser: User) {
  if (!currentUser.roles.includes(Role.ADMIN)) {
    throw new ForbiddenException();
  }
  // ...
}
```

### 3. Không hardcode roles
```typescript
// ❌ KHÔNG TỐT
if (user.roles.includes('admin')) { }

// ✅ TỐT
if (user.roles.includes(Role.ADMIN)) { }
```

### 4. Log authorization failures
```typescript
canActivate(context: ExecutionContext): boolean {
  const requiredRoles = this.reflector.get(...);
  const { user } = context.switchToHttp().getRequest();
  
  const hasRole = requiredRoles.some(role => user.roles?.includes(role));
  
  if (!hasRole) {
    // Log để audit
    console.log(`User ${user.email} tried to access ${context.getHandler().name} without permission`);
  }
  
  return hasRole;
}
```

---

## So sánh Authentication vs Authorization

| | Authentication | Authorization |
|---|---|---|
| **Câu hỏi** | Bạn là ai? | Bạn được làm gì? |
| **Mục đích** | Xác thực danh tính | Phân quyền |
| **Khi nào** | Khi login | Khi truy cập resource |
| **Công cụ** | JWT, Session, OAuth | Roles, Permissions |
| **HTTP Status** | 401 Unauthorized | 403 Forbidden |
| **Ví dụ** | Đăng nhập Facebook | Admin xóa bài viết |

---

## Tóm tắt

✅ **Đã học:**
- Role-Based Access Control (RBAC)
- Enum để định nghĩa roles
- @Roles() decorator
- RolesGuard để kiểm tra quyền
- Protect routes theo roles

🎯 **Flow:**
```
Login → JWT token (có roles)
→ Request với token
→ JwtAuthGuard verify token
→ RolesGuard check roles
→ Allow/Deny access
```

📚 **Bước tiếp theo:**
- Permission-based authorization
- Dynamic roles từ database
- Refresh token
- Rate limiting
- API documentation với Swagger

Chúc bạn học tốt! 🚀
