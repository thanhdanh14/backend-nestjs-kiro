# 🔐 Hướng Dẫn Login với OTP

## 📋 Tổng Quan

Hệ thống login 2 bước với OTP (One-Time Password):
1. User nhập email/password → Hệ thống gửi OTP qua email
2. User nhập OTP → Hệ thống xác thực và trả về token

---

## 🔄 Luồng Hoạt Động

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. POST /auth/login
       │    { email, password }
       ▼
┌─────────────────┐
│  Auth Service   │
│  - Validate     │
│  - Generate OTP │
│  - Save to DB   │
└──────┬──────────┘
       │
       │ 2. Send OTP Email
       ▼
┌─────────────┐
│ Mail Service│
│ → Mailtrap  │
└──────┬──────┘
       │
       │ 3. Response
       │    { message, email }
       ▼
┌─────────────┐
│   Client    │
│ Show OTP    │
│ Input Form  │
└──────┬──────┘
       │
       │ 4. POST /auth/verify-otp
       │    { email, otp }
       ▼
┌─────────────────┐
│  Auth Service   │
│  - Verify OTP   │
│  - Check Expire │
│  - Generate JWT │
└──────┬──────────┘
       │
       │ 5. Response
       │    { access_token, refresh_token }
       ▼
┌─────────────┐
│   Client    │
│ Save Token  │
│ Redirect    │
└─────────────┘
```

---

## 🚀 API Endpoints

### 1. Login - Gửi OTP

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Response (200 OK):**
```json
{
  "message": "OTP đã được gửi đến email của bạn. Vui lòng kiểm tra và xác thực.",
  "email": "user@example.com"
}
```

**Response (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "Email hoặc password không đúng"
}
```

---

### 2. Verify OTP - Nhận Token

**Endpoint:** `POST /auth/verify-otp`

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "OTP không đúng"
}
```

hoặc

```json
{
  "statusCode": 401,
  "message": "OTP đã hết hạn. Vui lòng đăng nhập lại."
}
```

---

## 🧪 Testing với Swagger

### Bước 1: Login
1. Mở Swagger: `http://localhost:3000/api`
2. Tìm endpoint `POST /auth/login`
3. Nhấn "Try it out"
4. Nhập:
```json
{
  "email": "test@example.com",
  "password": "Password123"
}
```
5. Nhấn "Execute"
6. Nhận response:
```json
{
  "message": "OTP đã được gửi đến email của bạn...",
  "email": "test@example.com"
}
```

### Bước 2: Kiểm tra Email
1. Vào Mailtrap inbox
2. Mở email "🔐 Mã OTP đăng nhập của bạn"
3. Copy mã OTP 6 số (ví dụ: `123456`)

### Bước 3: Verify OTP
1. Quay lại Swagger
2. Tìm endpoint `POST /auth/verify-otp`
3. Nhấn "Try it out"
4. Nhập:
```json
{
  "email": "test@example.com",
  "otp": "123456"
}
```
5. Nhấn "Execute"
6. Nhận response với tokens:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Bước 4: Sử dụng Token
1. Copy `access_token`
2. Nhấn nút "Authorize" ở đầu trang Swagger
3. Paste token vào
4. Nhấn "Authorize"
5. Bây giờ có thể gọi các API protected!

---

## 💾 Database Schema

```typescript
// User Schema
{
  name: string;
  email: string;
  password: string; // Hashed
  otpCode?: string; // OTP đã hash
  otpExpires?: Date; // Thời gian hết hạn
  refreshToken?: string; // Refresh token đã hash
}
```

---

## ⚙️ Cấu Hình

### OTP Settings
- **Độ dài:** 6 số
- **Thời gian hết hạn:** 5 phút
- **Lưu trữ:** Hash bằng bcrypt
- **Gửi qua:** Email (Mailtrap)

### Security
- OTP được hash trước khi lưu database
- OTP tự động xóa sau khi verify thành công
- OTP hết hạn sau 5 phút
- Không thể tái sử dụng OTP

---

## 🎨 Email Template

Email OTP có:
- ✅ Mã OTP lớn, dễ đọc
- ✅ Thời gian hết hạn rõ ràng
- ✅ Cảnh báo bảo mật
- ✅ Responsive design

---

## 🔒 Security Best Practices

### 1. Rate Limiting
Thêm rate limit cho endpoint login:
```typescript
@Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests/phút
@Post('login')
```

### 2. Brute Force Protection
- Giới hạn số lần nhập OTP sai
- Lock account sau 5 lần sai

### 3. OTP Expiration
- OTP hết hạn sau 5 phút
- Không thể tái sử dụng OTP cũ

### 4. Secure Storage
- OTP được hash trước khi lưu
- Không log OTP ra console trong production

---

## 🐛 Troubleshooting

### Lỗi: "OTP không hợp lệ hoặc đã hết hạn"
**Nguyên nhân:**
- Chưa login để nhận OTP
- OTP đã hết hạn (>5 phút)

**Giải pháp:**
- Login lại để nhận OTP mới

### Lỗi: "OTP không đúng"
**Nguyên nhân:**
- Nhập sai OTP
- Copy sai từ email

**Giải pháp:**
- Kiểm tra lại OTP trong email
- Đảm bảo không có dấu cách

### Lỗi: "Không thể gửi OTP"
**Nguyên nhân:**
- Email service lỗi
- Mailtrap credentials sai

**Giải pháp:**
- Kiểm tra Mailtrap config trong `.env`
- Xem log server để biết chi tiết

---

## 📊 Monitoring

### Log Events
```typescript
// Login
console.log('📧 Sending OTP to:', email);
console.log('🔐 OTP Code:', otpCode); // Chỉ trong dev

// Verify
console.log('✅ OTP verified successfully');
console.log('❌ OTP verification failed');
```

### Metrics to Track
- Số lần login thành công/thất bại
- Số lần OTP sai
- Thời gian trung bình từ login đến verify
- Tỷ lệ OTP hết hạn

---

## 🚀 Nâng Cao

### 1. Gửi OTP qua SMS
```typescript
// Thêm SMS service
async sendOtpSms(phone: string, otp: string) {
  // Dùng Twilio, AWS SNS, etc.
}
```

### 2. Backup OTP Method
```typescript
// Cho phép user chọn nhận OTP qua email hoặc SMS
async login(user: any, method: 'email' | 'sms') {
  if (method === 'email') {
    await this.sendOtpEmail(...);
  } else {
    await this.sendOtpSms(...);
  }
}
```

### 3. Remember Device
```typescript
// Không yêu cầu OTP nếu device đã được trust
if (isTrustedDevice(deviceId)) {
  return this.generateTokens(user);
}
```

### 4. Resend OTP
```typescript
@Post('resend-otp')
async resendOtp(@Body() { email }: { email: string }) {
  // Tạo và gửi OTP mới
}
```

---

## ✅ Checklist

- [ ] Đã thêm `otpCode` và `otpExpires` vào User schema
- [ ] Đã tạo DTO `VerifyOtpDto`
- [ ] Đã tạo template email OTP
- [ ] Đã cập nhật `login()` method để gửi OTP
- [ ] Đã tạo `verifyOtp()` method
- [ ] Đã thêm endpoint `/auth/verify-otp`
- [ ] Đã test qua Swagger
- [ ] Email OTP xuất hiện trong Mailtrap
- [ ] Verify OTP thành công và nhận được token

---

## 🎯 Kết Luận

Bạn đã có hệ thống login 2 bước với OTP:
- ✅ Bảo mật cao hơn login thông thường
- ✅ OTP gửi qua email
- ✅ OTP hết hạn sau 5 phút
- ✅ Email template đẹp
- ✅ Dễ dàng mở rộng (SMS, backup methods)

Hệ thống này phù hợp cho:
- Banking apps
- E-commerce
- Admin panels
- Bất kỳ app nào cần bảo mật cao
