# ⚡ Quick Start - Frontend

## 🚀 Cài Đặt Nhanh

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Tạo file .env.local
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 3. Chạy development
```bash
npm run dev
```

Mở: http://localhost:3001

## 📋 Checklist Trước Khi Chạy

- ✅ Backend đang chạy ở port 3000
- ✅ MongoDB đã kết nối
- ✅ Email service đã cấu hình (để nhận OTP)
- ✅ File .env.local đã tạo

## 🎯 Luồng Test Nhanh

### 1. Đăng Ký
1. Vào http://localhost:3001/register
2. Nhập: name, email, password
3. Click "Đăng Ký"
4. Kiểm tra email để lấy OTP

### 2. Xác Thực OTP
1. Nhập mã OTP 6 số từ email
2. Click "Xác Thực"
3. Tự động redirect vào Dashboard

### 3. Dashboard
- **Users**: Thêm, sửa, xóa users
- **Files**: Upload, xem, tải, xóa files
- **Change Password**: Đổi mật khẩu

## 🔑 Test Account (Nếu Backend Có Seed)

```
Email: admin@example.com
Password: 123456
```

## 📦 Dependencies Chính

```json
{
  "next": "16.0.3",
  "react": "19.2.0",
  "antd": "^5.22.5",
  "axios": "^1.7.9",
  "tailwindcss": "^4"
}
```

## 🎨 UI Preview

### Login Page
- Form đăng nhập với email/password
- Link đến Register
- Gradient background

### Dashboard
- Sidebar với menu
- Header với user dropdown
- Content area với tables

### Users Management
- Table với pagination
- Modal form thêm/sửa
- Confirm dialog xóa

### Files Management
- Upload button
- Table hiển thị files
- Preview ảnh, download files

## 🐛 Debug Tips

### Kiểm tra API connection
```javascript
// Browser console
console.log(process.env.NEXT_PUBLIC_API_URL)
```

### Kiểm tra tokens
```javascript
// Browser console
document.cookie
```

### Clear cookies
```javascript
// Browser console
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
```

## 📱 Responsive

- Desktop: Full sidebar
- Mobile: Collapsible sidebar
- Tablet: Optimized layout

---

**Happy Coding! 🎉**
