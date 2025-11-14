# 🔧 Fix Email - Các Bước Cần Làm

## ❌ Vấn Đề
Email không được gửi khi đăng ký vì:
1. Chưa cài `@nestjs/config` để đọc file `.env`
2. Chưa import `ConfigModule` vào `app.module.ts`

## ✅ Giải Pháp

### Bước 1: Cài đặt @nestjs/config
```bash
npm install @nestjs/config
```

### Bước 2: Cập nhật MAIL_USER trong file .env
Mở file `.env` và thay đổi:
```env
MAIL_USER=your-email@gmail.com
```
Thành email Gmail thực của bạn:
```env
MAIL_USER=youremail@gmail.com
```

### Bước 3: Cập nhật app.module.ts
Thêm `ConfigModule` vào đầu imports:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';  // ← THÊM DÒNG NÀY
import { MongooseModule } from '@nestjs/mongoose';
// ... các import khác ...

@Module({
  imports: [
    ConfigModule.forRoot({              // ← THÊM BLOCK NÀY
      isGlobal: true,                   // Cho phép dùng config ở mọi nơi
      envFilePath: '.env',              // Đường dẫn file .env
    }),
    
    MongooseModule.forRoot('mongodb://localhost:27017/nestjs-learning'),
    // ... các module khác ...
  ],
  // ...
})
export class AppModule {}
```

### Bước 4: Restart Server
```bash
# Dừng server (Ctrl + C)
# Chạy lại
npm run start:dev
```

### Bước 5: Test
1. Mở Swagger: http://localhost:3000/api
2. Đăng ký user mới với email thật của bạn
3. Kiểm tra hộp thư email

## 🧪 Test Nhanh Email

Thêm endpoint test vào `app.controller.ts`:

```typescript
import { Controller, Get } from '@nestjs/common';
import { MailService } from './mail/mail.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly mailService: MailService,  // ← THÊM
  ) {}

  @Get('test-email')  // ← THÊM ENDPOINT NÀY
  async testEmail() {
    try {
      await this.mailService.sendWelcomeEmail(
        'your-real-email@gmail.com',  // ← Thay bằng email của bạn
        'Test User'
      );
      return { 
        success: true, 
        message: 'Email đã được gửi! Kiểm tra hộp thư của bạn.' 
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'Lỗi: ' + error.message 
      };
    }
  }
}
```

Sau đó truy cập: http://localhost:3000/test-email

## 📋 Checklist

- [ ] Đã chạy `npm install @nestjs/config`
- [ ] Đã thêm `ConfigModule.forRoot()` vào `app.module.ts`
- [ ] Đã cập nhật `MAIL_USER` trong file `.env` với email thật
- [ ] Đã cập nhật `MAIL_PASSWORD` với App Password từ Gmail
- [ ] Đã restart server
- [ ] Đã test endpoint `/test-email`
- [ ] Email đã được gửi thành công

## 🚨 Nếu Vẫn Lỗi

### Kiểm tra console log
Khi đăng ký user, xem console có log lỗi gì không:
```
Lỗi khi gửi email: [Chi tiết lỗi]
```

### Các lỗi thường gặp:

**1. "Invalid login: 535-5.7.8"**
- Sai email hoặc App Password
- Chưa bật 2-Step Verification
- Chưa tạo App Password

**2. "Missing credentials"**
- File `.env` không được load
- Chưa cài `@nestjs/config`
- Chưa thêm `ConfigModule` vào `app.module.ts`

**3. "Connection timeout"**
- Firewall chặn port 587
- Thử đổi sang port 465 và set `secure: true` trong `mail.module.ts`

## 💡 Tip

Để debug, thêm log vào `mail.service.ts`:

```typescript
async sendWelcomeEmail(email: string, name: string) {
  console.log('🔍 Đang gửi email đến:', email);
  console.log('🔍 MAIL_USER:', process.env.MAIL_USER);
  console.log('🔍 MAIL_HOST:', process.env.MAIL_HOST);
  
  await this.mailerService.sendMail({
    to: email,
    subject: 'Chào mừng bạn đến với ứng dụng!',
    template: './welcome',
    context: {
      name: name,
      year: new Date().getFullYear(),
    },
  });
  
  console.log('✅ Email đã gửi thành công!');
}
```
