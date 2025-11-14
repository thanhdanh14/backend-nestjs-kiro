# 🔐 Roles & Permissions Guide

## 📋 Tổng Quan

Hệ thống có 3 roles chính:
- **USER** - Role mặc định khi đăng ký
- **MODERATOR** - Quản lý nội dung
- **ADMIN** - Toàn quyền

## 🎭 Role Definitions

### Role Enum
```typescript
// backend/src/auth/enums/role.enum.ts
export enum Role {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}
```

### User Schema
```typescript
@Prop({ type: [String], enum: Role, default: [Role.USER] })
roles: Role[];
```

**Lưu ý**: User có thể có **nhiều roles** (array)

---

## 🛡️ Current Permissions (Đã Cập Nhật)

### Auth Routes (Public)
| Route | Method | Auth Required | Roles |
|-------|--------|---------------|-------|
| `/api/auth/register` | POST | ❌ | - |
| `/api/auth/login` | POST | ❌ | - |
| `/api/auth/verify-otp` | POST | ❌ | - |
| `/api/auth/resend-otp` | POST | ❌ | - |
| `/api/auth/refresh` | POST | ❌ | - |
| `/api/auth/logout` | POST | ✅ | Any |
| `/api/auth/profile` | GET | ✅ | Any |

### Users Routes (Protected)
| Route | Method | Auth Required | Roles | Description |
|-------|--------|---------------|-------|-------------|
| `/api/users` | GET | ✅ | **Any** | Lấy danh sách users |
| `/api/users` | POST | ✅ | **Any** | Tạo user mới |
| `/api/users/:id` | GET | ✅ | Any | Lấy user theo ID |
| `/api/users/:id` | PATCH | ✅ | Owner/Admin | Cập nhật user |
| `/api/users/:id` | DELETE | ✅ | **Any** | Xóa user |
| `/api/users/me/profile` | GET | ✅ | Any | Lấy profile của mình |
| `/api/users/:id/with-files` | GET | ✅ | Any | User + files |
| `/api/users/stats/all` | GET | ✅ | **Any** | Users + stats |

### Files Routes (Protected)
| Route | Method | Auth Required | Roles | Description |
|-------|--------|---------------|-------|-------------|
| `/api/files` | GET | ✅ | Any | Lấy danh sách files |
| `/api/files/upload` | POST | ✅ | Any | Upload file |
| `/api/files/:id` | GET | ✅ | Any | Download file |
| `/api/files/:id` | DELETE | ✅ | Any | Xóa file |

---

## 🔧 Cách Sử Dụng Guards

### 1. JWT Auth Guard (Kiểm tra đã login)
```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@CurrentUser() user: User) {
  return user;
}
```

### 2. Roles Guard (Kiểm tra role)
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Delete(':id')
deleteUser(@Param('id') id: string) {
  return this.usersService.remove(id);
}
```

**Lưu ý**: 
- `JwtAuthGuard` phải đứng **trước** `RolesGuard`
- `RolesGuard` cần user từ `JwtAuthGuard`

### 3. Multiple Roles (OR logic)
```typescript
@Roles(Role.ADMIN, Role.MODERATOR)
// ADMIN HOẶC MODERATOR đều được
```

### 4. Controller Level Guards
```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
// Áp dụng cho TẤT CẢ routes trong controller
export class UsersController {
  // ...
}
```

---

## 👤 Cách Thay Đổi Role của User

### Option 1: Trực tiếp trong MongoDB
```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { roles: ["admin"] } }
)
```

### Option 2: Tạo API endpoint (Khuyến nghị)
```typescript
// users.controller.ts
@Patch(':id/roles')
@Roles(Role.ADMIN)
async updateRoles(
  @Param('id') id: string,
  @Body() body: { roles: Role[] }
) {
  return this.usersService.updateRoles(id, body.roles);
}
```

### Option 3: Seed Data
```typescript
// Tạo admin user khi khởi động app
async function seedAdmin() {
  const admin = await userModel.findOne({ email: 'admin@example.com' });
  if (!admin) {
    await userModel.create({
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      name: 'Admin',
      roles: [Role.ADMIN],
    });
  }
}
```

---

## 🔒 Security Best Practices

### 1. Principle of Least Privilege
Chỉ cho quyền tối thiểu cần thiết:
```typescript
// ❌ BAD: Mọi user đều có thể xóa
@Delete(':id')
remove(@Param('id') id: string) {}

// ✅ GOOD: Chỉ admin mới xóa được
@Delete(':id')
@Roles(Role.ADMIN)
remove(@Param('id') id: string) {}
```

### 2. Owner Check
User chỉ được sửa/xóa data của mình:
```typescript
@Patch(':id')
update(
  @Param('id') id: string,
  @Body() updateDto: UpdateDto,
  @CurrentUser() currentUser: User,
) {
  const isAdmin = currentUser.roles?.includes(Role.ADMIN);
  const isOwner = currentUser._id?.toString() === id;
  
  if (!isAdmin && !isOwner) {
    throw new ForbiddenException('Bạn không có quyền');
  }
  
  return this.service.update(id, updateDto);
}
```

### 3. Sensitive Data Protection
```typescript
// Không trả về password
const { password, ...userWithoutPassword } = user;
return userWithoutPassword;
```

---

## 🎯 Demo Setup (Development)

Để test dễ dàng, hiện tại **tất cả authenticated users** đều có quyền:
- ✅ Xem danh sách users
- ✅ Tạo user mới
- ✅ Xóa user
- ✅ Upload/download files

**Production**: Nên bật lại role restrictions:
```typescript
@Get()
@Roles(Role.ADMIN, Role.MODERATOR)  // Uncomment này
findAll() {
  return this.usersService.findAll();
}
```

---

## 📝 Tạo Admin User Đầu Tiên

### Cách 1: Qua MongoDB Compass
1. Mở MongoDB Compass
2. Connect đến database
3. Vào collection `users`
4. Tìm user cần promote
5. Edit field `roles`: `["admin"]`

### Cách 2: Qua Mongo Shell
```bash
mongosh
use your_database_name

db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { roles: ["admin"] } }
)
```

### Cách 3: Tạo Script Seed
```typescript
// backend/src/scripts/seed-admin.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const adminEmail = 'admin@example.com';
  const existingAdmin = await usersService.findByEmail(adminEmail);

  if (!existingAdmin) {
    await usersService.create({
      email: adminEmail,
      password: await bcrypt.hash('admin123', 10),
      name: 'Admin User',
      roles: ['admin'],
    });
    console.log('✅ Admin user created!');
  } else {
    console.log('ℹ️ Admin user already exists');
  }

  await app.close();
}

bootstrap();
```

Run script:
```bash
ts-node src/scripts/seed-admin.ts
```

---

## 🔍 Debug Tips

### Check User Roles
```typescript
console.log('User roles:', currentUser.roles);
console.log('Is admin?', currentUser.roles?.includes(Role.ADMIN));
```

### Check JWT Payload
```typescript
// auth.service.ts
const payload = {
  sub: user._id,
  email: user.email,
  name: user.name,
  roles: user.roles,  // Thêm roles vào JWT
};
```

### Frontend: Check User Role
```typescript
const { user } = useAuth();
const isAdmin = user?.roles?.includes('admin');

{isAdmin && (
  <Button>Admin Only Feature</Button>
)}
```

---

**Happy Coding! 🎉**
