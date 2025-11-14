# 🔧 Hướng Dẫn Tạo App Password Gmail

## ❌ Lỗi Hiện Tại
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

**Nguyên nhân:** App Password không đúng hoặc chưa được tạo.

---

## ✅ Cách Tạo App Password Đúng

### Bước 1: Bật 2-Step Verification
1. Truy cập: https://myaccount.google.com/security
2. Tìm mục **"2-Step Verification"**
3. Nhấn **"Get Started"** và làm theo hướng dẫn
4. Xác thực bằng số điện thoại

### Bước 2: Tạo App Password
1. Sau khi bật 2-Step Verification, truy cập: https://myaccount.google.com/apppasswords
2. Nếu không thấy trang này, tìm kiếm "App passwords" trong Google Account
3. Chọn:
   - **Select app:** Mail
   - **Select device:** Other (Custom name)
   - Nhập tên: "NestJS Backend"
4. Nhấn **"Generate"**
5. Gmail sẽ hiển thị mật khẩu 16 ký tự, ví dụ: `abcd efgh ijkl mnop`

### Bước 3: Copy App Password
**QUAN TRỌNG:** Copy toàn bộ 16 ký tự (bỏ dấu cách)

Ví dụ Gmail cho: `abcd efgh ijkl mnop`
→ Copy vào .env: `abcdefghijklmnop`

### Bước 4: Cập nhật file .env
Mở file `.env` và thay đổi:

```env
MAIL_USER=danhbien14992@gmail.com
MAIL_PASSWORD=abcdefghijklmnop
```

**Lưu ý:**
- ✅ Không có dấu cách
- ✅ Không có dấu ngoặc kép
- ✅ Đúng 16 ký tự

### Bước 5: Restart Server
```bash
# Dừng server (Ctrl+C)
npm run start:dev
```

### Bước 6: Kiểm tra Console Log
Khi server khởi động, bạn phải thấy:
```
🔍 Email Config Debug:
  MAIL_HOST: smtp.gmail.com
  MAIL_PORT: 587
  MAIL_USER: danhbien14992@gmail.com
  MAIL_PASSWORD: ***mnop
```

Nếu thấy `MAIL_PASSWORD: MISSING` → File .env chưa được load đúng

### Bước 7: Test Email
```bash
# Truy cập
http://localhost:3000/test-email
```

---

## 🚨 Nếu Không Thấy "App Passwords" Option

### Nguyên nhân:
- Chưa bật 2-Step Verification
- Tài khoản Google Workspace (doanh nghiệp) bị admin chặn
- Tài khoản quá mới

### Giải pháp:
1. Đảm bảo đã bật 2-Step Verification
2. Đợi 24h sau khi bật 2-Step Verification
3. Thử truy cập trực tiếp: https://myaccount.google.com/apppasswords
4. Hoặc tìm kiếm "app password" trong Google Account settings

---

## 🔍 Debug: Kiểm Tra Biến Môi Trường

Thêm endpoint debug vào `app.controller.ts`:

```typescript
@Get('debug-env')
debugEnv() {
  return {
    MAIL_HOST: process.env.MAIL_HOST,
    MAIL_PORT: process.env.MAIL_PORT,
    MAIL_USER: process.env.MAIL_USER,
    MAIL_PASSWORD: process.env.MAIL_PASSWORD ? '***' + process.env.MAIL_PASSWORD.slice(-4) : 'MISSING',
    NODE_ENV: process.env.NODE_ENV,
  };
}
```

Truy cập: `http://localhost:3000/debug-env`

Nếu thấy `MAIL_PASSWORD: "MISSING"` → File `.env` không được load

---

## 💡 Giải Pháp Thay Thế: Hardcode Tạm (Chỉ để test)

Nếu vẫn không được, thử hardcode trong `mail.module.ts`:

```typescript
transport: {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'danhbien14992@gmail.com',
    pass: 'abcdefghijklmnop', // ← Thay bằng App Password thật
  },
},
```

**Lưu ý:** Chỉ dùng để test, sau đó phải chuyển về dùng .env

---

## ✅ Checklist

- [ ] Đã bật 2-Step Verification cho Gmail
- [ ] Đã tạo App Password từ https://myaccount.google.com/apppasswords
- [ ] Đã copy App Password (16 ký tự, không có dấu cách)
- [ ] Đã cập nhật `MAIL_PASSWORD` trong file `.env`
- [ ] Đã restart server
- [ ] Đã thấy log "🔍 Email Config Debug" khi server khởi động
- [ ] `MAIL_PASSWORD` không hiển thị "MISSING"

---

## 📞 Nếu Vẫn Lỗi

Có thể Gmail đang chặn. Thử:

1. **Bật "Less secure app access"** (nếu có):
   - https://myaccount.google.com/lesssecureapps
   - Tuy nhiên Google đã tắt tính năng này, nên phải dùng App Password

2. **Kiểm tra email có bị khóa không:**
   - Vào Gmail và xem có thông báo bảo mật nào không

3. **Thử email khác:**
   - Tạo Gmail mới để test
   - Hoặc dùng dịch vụ khác như Mailtrap (cho development)

---

## 🎯 Mailtrap - Giải Pháp Cho Development

Nếu chỉ muốn test email (không gửi thật), dùng Mailtrap:

1. Đăng ký miễn phí: https://mailtrap.io
2. Lấy SMTP credentials
3. Cập nhật `.env`:

```env
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your-mailtrap-username
MAIL_PASSWORD=your-mailtrap-password
```

Email sẽ không gửi thật mà hiển thị trong Mailtrap inbox!
