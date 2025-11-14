# 🎓 NestJS Learning Project

Project backend NestJS đầy đủ với Authentication, Authorization, MongoDB, và nhiều tính năng chuyên nghiệp khác.

---

## ✨ Features

- ✅ **Authentication** - JWT, Passport, Login/Register
- ✅ **Authorization** - Role-based access control (RBAC)
- ✅ **Refresh Token** - Token rotation, Logout
- ✅ **MongoDB** - Mongoose integration
- ✅ **Validation** - class-validator
- ✅ **Repository Pattern** - Clean architecture
- ✅ **Interface Pattern** - Type safety
- ✅ **Swagger** - API documentation
- ✅ **Rate Limiting** - DDoS protection
- ✅ **Security** - bcrypt, JWT, Guards

---

## 🚀 Quick Start

### 1. Cài đặt
```bash
npm install
```

### 2. Chạy MongoDB
```bash
# Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Hoặc cài MongoDB local
```

### 3. Chạy server
```bash
npm run start:dev
```

### 4. Truy cập
- **API:** http://localhost:3000
- **Swagger Docs:** http://localhost:3000/api

---

## 📚 Documentation

Đọc các file guide để hiểu chi tiết:

1. **LEARNING_GUIDE.md** - Giới thiệu NestJS cơ bản
2. **VALIDATION_GUIDE.md** - Validation với class-validator
3. **MONGODB_GUIDE.md** - MongoDB integration
4. **REPOSITORY_PATTERN_GUIDE.md** - Repository pattern
5. **INTERFACE_GUIDE.md** - Interface pattern
6. **AUTH_GUIDE.md** - Authentication với JWT
7. **AUTHORIZATION_GUIDE.md** - Authorization với Roles
8. **REFRESH_TOKEN_GUIDE.md** - Refresh token
9. **SWAGGER_GUIDE.md** - API documentation
10. **RATE_LIMITING_GUIDE.md** - Rate limiting
11. **COMPLETE_GUIDE.md** - Tổng hợp tất cả

---

## 📖 API Endpoints

### Authentication
```
POST   /auth/register      - Đăng ký
POST   /auth/login         - Đăng nhập
POST   /auth/refresh       - Refresh token
POST   /auth/logout        - Đăng xuất
GET    /auth/profile       - Lấy profile
```

### Users
```
POST   /users              - Tạo user (Admin)
GET    /users              - Lấy tất cả users (Admin/Moderator)
GET    /users/:id          - Lấy user theo ID
PATCH  /users/:id          - Cập nhật user
DELETE /users/:id          - Xóa user (Admin)
```

---

## 🧪 Test API

### Đăng ký
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@test.com",
    "password": "Password123"
  }'
```

### Đăng nhập
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "Password123"
  }'
```

### Lấy profile
```bash
curl http://localhost:3000/auth/profile \
  -H "Authorization: Bearer <your_token>"
```

---

## 🏗️ Project Structure

```
src/
├── auth/                   # Authentication & Authorization
│   ├── decorators/
│   ├── dto/
│   ├── enums/
│   ├── guards/
│   ├── interfaces/
│   └── strategies/
├── users/                  # User Management
│   ├── dto/
│   ├── interfaces/
│   └── schemas/
├── app.module.ts
└── main.ts
```

---

## 🔐 Security

- **Password:** Hash với bcrypt (salt rounds: 10)
- **JWT:** Access token (15m), Refresh token (7d)
- **Rate Limiting:** 10 requests/60s
- **Validation:** class-validator
- **Authorization:** Role-based (USER, ADMIN, MODERATOR)

---

## 🎯 Tech Stack

- **Framework:** NestJS 10
- **Database:** MongoDB + Mongoose
- **Authentication:** Passport + JWT
- **Validation:** class-validator
- **Documentation:** Swagger
- **Rate Limiting:** @nestjs/throttler

---

## 📦 Dependencies

```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/jwt": "^10.1.0",
  "@nestjs/mongoose": "^10.0.0",
  "@nestjs/passport": "^10.0.0",
  "@nestjs/swagger": "^7.1.0",
  "@nestjs/throttler": "^5.0.0",
  "bcrypt": "^5.1.1",
  "class-validator": "^0.14.2",
  "mongoose": "^7.5.0",
  "passport-jwt": "^4.0.1"
}
```

---

## 🌟 Learning Path

1. ✅ NestJS Basics
2. ✅ Validation
3. ✅ MongoDB
4. ✅ Repository Pattern
5. ✅ Interface Pattern
6. ✅ Authentication
7. ✅ Authorization
8. ✅ Refresh Token
9. ✅ Swagger
10. ✅ Rate Limiting

**Next Steps:**
- Testing (Jest)
- File Upload
- Email Service
- Caching (Redis)
- WebSocket
- GraphQL

---

## 📝 License

MIT

---

## 🤝 Contributing

Pull requests are welcome!

---

## 📞 Support

Đọc các file guide trong project để hiểu chi tiết từng phần.

---

**Happy Coding!** 🚀
