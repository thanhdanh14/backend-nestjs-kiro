# 🔐 Authentication Flow - Chi Tiết

## 📋 Tổng Quan Flow

Hệ thống sử dụng **2-Factor Authentication với OTP** qua email.

---

## 1️⃣ ĐĂNG KÝ (Register)

### Frontend: `/register`
```typescript
POST /api/auth/register
Body: {
  name: string,
  email: string,
  password: string
  // confirmPassword chỉ dùng ở frontend, không gửi xuống backend
}
```

### Backend Response:
```json
{
  "message": "Đăng ký thành công! OTP đã được gửi đến email của bạn.",
  "email": "user@example.com"
}
```

### Flow:
1. User điền form (name, email, password, confirmPassword)
2. Frontend xóa `confirmPassword` trước khi gửi
3. Backend tạo user mới
4. Backend tạo OTP 6 số và lưu vào DB (hash)
5. Backend gửi OTP qua email
6. Frontend redirect đến `/verify-otp?email=xxx`

---

## 2️⃣ ĐĂNG NHẬP (Login)

### Frontend: `/login`
```typescript
POST /api/auth/login
Body: {
  email: string,
  password: string
}
```

### Backend Response:
```json
{
  "message": "OTP đã được gửi đến email của bạn. Vui lòng kiểm tra và xác thực.",
  "email": "user@example.com"
}
```

### Flow:
1. User nhập email và password
2. Backend validate email/password
3. Backend tạo OTP mới và gửi qua email
4. Frontend redirect đến `/verify-otp?email=xxx`

---

## 3️⃣ XÁC THỰC OTP (Verify OTP)

### Frontend: `/verify-otp?email=xxx`
```typescript
POST /api/auth/verify-otp
Body: {
  email: string,
  otp: string  // 6 số
}
```

### Backend Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Flow:
1. User nhập mã OTP 6 số từ email
2. Backend verify OTP (check hash và expiry)
3. Backend trả về `access_token` và `refresh_token`
4. Frontend lưu tokens vào cookies
5. Frontend gọi `GET /api/auth/profile` để lấy user info
6. Frontend redirect đến `/dashboard`

### OTP Rules:
- ⏱️ Hết hạn sau **5 phút**
- 🔢 Mã **6 số** random
- 🔒 Lưu dạng **hash** trong DB
- ✅ Xóa sau khi verify thành công

---

## 4️⃣ GỬI LẠI OTP (Resend OTP)

### Frontend: Button "Gửi lại OTP" trong `/verify-otp`
```typescript
POST /api/auth/resend-otp
Body: {
  email: string
}
```

### Backend Response:
```json
{
  "message": "OTP mới đã được gửi đến email của bạn"
}
```

### Flow:
1. User click "Gửi lại OTP"
2. Backend tạo OTP mới
3. Backend gửi email mới
4. Frontend hiển thị countdown 60s

---

## 5️⃣ LẤY PROFILE (Get Profile)

### Frontend: Tự động gọi sau khi verify OTP
```typescript
GET /api/auth/profile
Headers: {
  Authorization: "Bearer {access_token}"
}
```

### Backend Response:
```json
{
  "_id": "...",
  "email": "user@example.com",
  "name": "Nguyen Van A",
  "role": "user",
  "isEmailVerified": true,
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## 6️⃣ REFRESH TOKEN

### Frontend: Tự động qua Axios Interceptor
```typescript
POST /api/auth/refresh
Body: {
  refresh_token: string
}
```

### Backend Response:
```json
{
  "access_token": "new_token...",
  "refresh_token": "new_refresh_token..."
}
```

### Flow:
1. Access token hết hạn (15 phút)
2. API trả về 401
3. Axios interceptor tự động gọi `/auth/refresh`
4. Lưu tokens mới
5. Retry request ban đầu

---

## 7️⃣ ĐĂNG XUẤT (Logout)

### Frontend: User menu → Đăng xuất
```typescript
POST /api/auth/logout
Headers: {
  Authorization: "Bearer {access_token}"
}
```

### Backend Response:
```json
{
  "message": "Đăng xuất thành công"
}
```

### Flow:
1. Backend xóa refresh token trong DB
2. Frontend xóa cookies
3. Frontend redirect về `/login`

---

## 🔒 Token Management

### Access Token
- ⏱️ Expire: **15 phút**
- 💾 Lưu: Cookie `access_token`
- 🎯 Dùng: Mọi API request (Authorization header)

### Refresh Token
- ⏱️ Expire: **7 ngày**
- 💾 Lưu: Cookie `refresh_token`
- 🎯 Dùng: Refresh access token khi hết hạn

### Cookie Settings
```typescript
Cookies.set('access_token', token, { expires: 1 });  // 1 day
Cookies.set('refresh_token', token, { expires: 7 }); // 7 days
```

---

## 🛡️ Protected Routes

### Frontend: `/dashboard/*`
Tất cả routes trong dashboard đều protected:

```typescript
<ProtectedRoute>
  <DashboardLayout>
    {children}
  </DashboardLayout>
</ProtectedRoute>
```

### Check Logic:
1. Kiểm tra `access_token` trong cookie
2. Nếu không có → redirect `/login`
3. Nếu có → load user profile
4. Nếu load profile fail → redirect `/login`

---

## 📧 Email Templates

### 1. OTP Email (Register & Login)
```
Subject: Mã OTP xác thực tài khoản

Xin chào {name},

Mã OTP của bạn là: {otpCode}

Mã này có hiệu lực trong 5 phút.

Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.
```

---

## 🔄 Flow Diagram

```
REGISTER
┌─────────┐     ┌─────────┐     ┌──────────┐     ┌───────────┐
│ Register│────▶│ Backend │────▶│Send OTP  │────▶│Verify OTP │
│  Form   │     │Create   │     │via Email │     │   Page    │
└─────────┘     │  User   │     └──────────┘     └───────────┘
                └─────────┘                              │
                                                         ▼
                                                   ┌──────────┐
                                                   │Dashboard │
                                                   └──────────┘

LOGIN
┌─────────┐     ┌─────────┐     ┌──────────┐     ┌───────────┐
│  Login  │────▶│ Backend │────▶│Send OTP  │────▶│Verify OTP │
│  Form   │     │Validate │     │via Email │     │   Page    │
└─────────┘     │Email/Pwd│     └──────────┘     └───────────┘
                └─────────┘                              │
                                                         ▼
                                                   ┌──────────┐
                                                   │Dashboard │
                                                   └──────────┘
```

---

## ✅ Security Features

1. ✅ **Password Hashing**: bcrypt với salt rounds 10
2. ✅ **OTP Hashing**: OTP cũng được hash trước khi lưu DB
3. ✅ **Token Expiry**: Access token 15m, Refresh token 7d
4. ✅ **OTP Expiry**: 5 phút
5. ✅ **CORS Protection**: Chỉ cho phép frontend URLs
6. ✅ **JWT Guards**: Protect routes với JwtAuthGuard
7. ✅ **Auto Refresh**: Tự động refresh token khi hết hạn

---

**Happy Coding! 🎉**
