# 📧 Hướng Dẫn Sử Dụng Email Module trong NestJS

## 📋 Mục Lục
1. [Cấu Trúc Module](#cấu-trúc-module)
2. [Cấu Hình Email](#cấu-hình-email)
3. [Các Template Email](#các-template-email)
4. [Sử Dụng Mail Service](#sử-dụng-mail-service)
5. [Tích Hợp với Auth Module](#tích-hợp-với-auth-module)
6. [Testing](#testing)

---

## 🏗️ Cấu Trúc Module

```
src/mail/
├── templates/
│   ├── welcome.hbs           # Template email chào mừng
│   ├── verify-email.hbs      # Template xác thực email
│   └── reset-password.hbs    # Template đặt lại mật khẩu
├── mail.module.ts            # Module chính
└── mail.service.ts           # Service xử lý gửi email
```

---

## ⚙️ Cấu Hình Email

### 1. Cài Đặt Thư Viện

```bash
npm install @nestjs-modules/mailer nodemailer handlebars
npm install -D @types/nodemailer
```

### 2. Cấu Hình Biến Môi Trường

Tạo file `.env` từ `.env.example` và cập nhật:

```env
# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=noreply@example.com
MAIL_FROM_NAME=NestJS App
FRONTEND_URL=http://localhost:3000
```

### 3. Lấy App Password từ Gmail

**Bước 1:** Bật xác thực 2 bước cho tài khoản Gmail
- Vào: https://myaccount.google.com/security
- Bật "2-Step Verification"

**Bước 2:** Tạo App Password
- Vào: https://myaccount.google.com/apppasswords
- Chọn "Mail" và "Other (Custom name)"
- Nhập tên: "NestJS App"
- Copy mật khẩu 16 ký tự và dán vào `MAIL_PASSWORD`

---

## 📧 Các Template Email

### 1. Welcome Email (welcome.hbs)
Email chào mừng người dùng mới đăng ký.

**Biến sử dụng:**
- `{{name}}`: Tên người dùng
- `{{year}}`: Năm hiện tại

### 2. Verify Email (verify-email.hbs)
Email xác thực địa chỉ email.

**Biến sử dụng:**
- `{{verifyUrl}}`: Link xác thực email
- `{{year}}`: Năm hiện tại

### 3. Reset Password (reset-password.hbs)
Email đặt lại mật khẩu.

**Biến sử dụng:**
- `{{resetUrl}}`: Link đặt lại mật khẩu
- `{{year}}`: Năm hiện tại

---

## 🔧 Sử Dụng Mail Service

### Import MailModule vào Module của bạn

```typescript
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  // ...
})
export class YourModule {}
```

### Inject MailService vào Service

```typescript
import { MailService } from '../mail/mail.service';

@Injectable()
export class YourService {
  constructor(private readonly mailService: MailService) {}
  
  async someMethod() {
    // Sử dụng mailService ở đây
  }
}
```

### Các Phương Thức Có Sẵn

#### 1. Gửi Email Chào Mừng
```typescript
await this.mailService.sendWelcomeEmail(
  'user@example.com',
  'Nguyễn Văn A'
);
```

#### 2. Gửi Email Xác Thực
```typescript
const token = 'verification-token-here';
await this.mailService.sendVerificationEmail(
  'user@example.com',
  token
);
```

#### 3. Gửi Email Đặt Lại Mật Khẩu
```typescript
const resetToken = 'reset-token-here';
await this.mailService.sendPasswordResetEmail(
  'user@example.com',
  resetToken
);
```

#### 4. Gửi Email Tùy Chỉnh
```typescript
await this.mailService.sendCustomEmail(
  'user@example.com',
  'Tiêu đề email',
  'Nội dung text thuần',
  '<h1>Nội dung HTML</h1>' // Optional
);
```

---

## 🔐 Tích Hợp với Auth Module

Email đã được tích hợp tự động vào quá trình đăng ký:

```typescript
// src/auth/auth.service.ts
async register(registerDto: RegisterDto) {
  // ... tạo user ...
  
  // Gửi email chào mừng tự động
  try {
    await this.mailService.sendWelcomeEmail(user.email, user.name);
  } catch (error) {
    console.error('Lỗi khi gửi email:', error);
    // Không throw error để không ảnh hưởng đến quá trình đăng ký
  }
  
  // ... return tokens ...
}
```

---

## 🧪 Testing

### Test Gửi Email Khi Đăng Ký

```bash
# POST http://localhost:3000/auth/register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "name": "Test User"
  }'
```

Sau khi đăng ký thành công, kiểm tra email của bạn!

### Test Trực Tiếp Mail Service

Tạo endpoint test trong `app.controller.ts`:

```typescript
import { MailService } from './mail/mail.service';

@Controller()
export class AppController {
  constructor(private readonly mailService: MailService) {}
  
  @Get('test-email')
  async testEmail() {
    await this.mailService.sendWelcomeEmail(
      'your-email@gmail.com',
      'Test User'
    );
    return { message: 'Email đã được gửi!' };
  }
}
```

Sau đó truy cập: `http://localhost:3000/test-email`

---

## 🎨 Tùy Chỉnh Template

### Thêm Template Mới

**Bước 1:** Tạo file template mới trong `src/mail/templates/`

```handlebars
<!-- src/mail/templates/custom.hbs -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    /* CSS của bạn */
  </style>
</head>
<body>
  <h1>Xin chào {{name}}</h1>
  <p>{{message}}</p>
</body>
</html>
```

**Bước 2:** Thêm method mới trong `mail.service.ts`

```typescript
async sendCustomTemplate(email: string, name: string, message: string) {
  await this.mailerService.sendMail({
    to: email,
    subject: 'Tiêu đề email',
    template: './custom',
    context: {
      name: name,
      message: message,
    },
  });
}
```

---

## 🚨 Xử Lý Lỗi

### Lỗi Thường Gặp

#### 1. "Invalid login: 535-5.7.8 Username and Password not accepted"
**Nguyên nhân:** Sai email hoặc password
**Giải pháp:** 
- Kiểm tra lại `MAIL_USER` và `MAIL_PASSWORD`
- Đảm bảo đã tạo App Password từ Gmail

#### 2. "Connection timeout"
**Nguyên nhân:** Không kết nối được SMTP server
**Giải pháp:**
- Kiểm tra `MAIL_HOST` và `MAIL_PORT`
- Kiểm tra firewall/antivirus
- Thử đổi port 587 thành 465 và set `secure: true`

#### 3. Template không tìm thấy
**Nguyên nhân:** Đường dẫn template sai
**Giải pháp:**
- Kiểm tra tên file template (không có typo)
- Đảm bảo file nằm trong `src/mail/templates/`

### Best Practices

```typescript
// Luôn wrap email sending trong try-catch
try {
  await this.mailService.sendWelcomeEmail(email, name);
} catch (error) {
  console.error('Email error:', error);
  // Log error nhưng không throw để không ảnh hưởng flow chính
}
```

---

## 📚 Mở Rộng

### Gửi Email với Attachment

```typescript
async sendEmailWithAttachment(email: string) {
  await this.mailerService.sendMail({
    to: email,
    subject: 'Email có đính kèm',
    text: 'Xem file đính kèm',
    attachments: [
      {
        filename: 'document.pdf',
        path: './files/document.pdf',
      },
    ],
  });
}
```

### Gửi Email Hàng Loạt

```typescript
async sendBulkEmails(emails: string[], subject: string, content: string) {
  const promises = emails.map(email => 
    this.mailService.sendCustomEmail(email, subject, content)
  );
  
  await Promise.all(promises);
}
```

### Queue Email (Nâng Cao)

Để tránh block request, nên dùng queue như Bull:

```bash
npm install @nestjs/bull bull
```

```typescript
// Thêm email vào queue thay vì gửi trực tiếp
await this.emailQueue.add('welcome', {
  email: user.email,
  name: user.name,
});
```

---

## ✅ Checklist

- [ ] Đã cài đặt thư viện
- [ ] Đã cấu hình `.env`
- [ ] Đã tạo App Password từ Gmail
- [ ] Đã import MailModule vào AppModule
- [ ] Đã test gửi email thành công
- [ ] Email tự động gửi khi đăng ký

---

## 🎯 Kết Luận

Bạn đã có một hệ thống email hoàn chỉnh với:
- ✅ 3 template email đẹp mắt
- ✅ Tự động gửi email khi đăng ký
- ✅ Dễ dàng mở rộng và tùy chỉnh
- ✅ Xử lý lỗi an toàn

**Lưu ý:** Trong production, nên sử dụng dịch vụ email chuyên nghiệp như SendGrid, AWS SES, hoặc Mailgun thay vì Gmail SMTP.
