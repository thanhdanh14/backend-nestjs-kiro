# 📧 Dùng Mailtrap - Giải Pháp Dễ Nhất Cho Development

## ❌ Vấn Đề với Gmail
- Phải tạo App Password
- Dễ bị lỗi authentication
- Phức tạp để setup

## ✅ Mailtrap - Giải Pháp Tốt Hơn

Mailtrap là dịch vụ email testing MIỄN PHÍ:
- ✅ Không cần App Password
- ✅ Setup trong 2 phút
- ✅ Xem email ngay trong web
- ✅ Không gửi email thật (an toàn cho testing)

---

## 🚀 Setup Mailtrap (2 phút)

### Bước 1: Đăng ký Mailtrap
1. Truy cập: https://mailtrap.io/register/signup
2. Đăng ký miễn phí (có thể dùng Google login)

### Bước 2: Lấy SMTP Credentials
1. Sau khi đăng nhập, vào **Email Testing** → **Inboxes**
2. Chọn inbox "My Inbox" (hoặc tạo mới)
3. Vào tab **SMTP Settings**
4. Chọn **Nodemailer** trong dropdown
5. Copy thông tin:
   - Host: `sandbox.smtp.mailtrap.io`
   - Port: `2525`
   - Username: (ví dụ: `abc123def456`)
   - Password: (ví dụ: `xyz789uvw012`)

### Bước 3: Cập nhật .env
```env
# Email Configuration - MAILTRAP
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=abc123def456
MAIL_PASSWORD=xyz789uvw012
MAIL_FROM=noreply@yourapp.com
MAIL_FROM_NAME=NestJS App
```

### Bước 4: Restart Server
```bash
npm run start:dev
```

### Bước 5: Test
1. Đăng ký user mới qua Swagger
2. Vào Mailtrap inbox
3. Xem email đã được "gửi" (hiển thị trong Mailtrap)

---

## 🎯 Ưu Điểm

✅ **Không cần App Password**
✅ **Không gửi email thật** (an toàn khi test)
✅ **Xem email ngay trong web**
✅ **Kiểm tra HTML rendering**
✅ **Xem spam score**
✅ **Miễn phí 100% cho development**

---

## 📝 Sau Khi Development Xong

Khi deploy production, đổi sang:
- **SendGrid** (miễn phí 100 emails/ngày)
- **AWS SES** (rẻ, $0.10/1000 emails)
- **Mailgun** (miễn phí 5000 emails/tháng)

Chỉ cần đổi SMTP credentials trong `.env`!

---

## 🔄 So Sánh

| Feature | Gmail | Mailtrap |
|---------|-------|----------|
| Setup | Phức tạp | Dễ |
| App Password | Cần | Không cần |
| Email thật | Gửi thật | Không gửi |
| Xem email | Phải vào Gmail | Xem trong web |
| Miễn phí | Có | Có |
| Cho Production | Không nên | Không (chỉ dev) |

---

## 💡 Khuyến Nghị

**Development:** Dùng Mailtrap
**Production:** Dùng SendGrid/AWS SES/Mailgun

Mailtrap giúp bạn test email mà không lo spam inbox thật!
