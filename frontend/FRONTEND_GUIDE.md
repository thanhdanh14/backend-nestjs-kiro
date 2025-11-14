# 🎨 Frontend User Management System - Hướng Dẫn Đầy Đủ

## 📋 Tổng Quan

Frontend được xây dựng với:
- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Ant Design 5** (UI Components)
- **Tailwind CSS** (Styling)
- **Axios** (API calls)
- **js-cookie** (Cookie management)

## 🚀 Cài Đặt và Chạy

### 1. Cài đặt dependencies
```bash
cd frontend
npm install
```

### 2. Cấu hình môi trường
Tạo file `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 3. Chạy development server
```bash
npm run dev
```

Mở trình duyệt: http://localhost:3001

## 📁 Cấu Trúc Thư Mục

```
frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout với AntD Provider
│   ├── page.tsx                 # Home page (redirect)
│   ├── login/                   # Trang đăng nhập
│   ├── register/                # Trang đăng ký
│   ├── verify-otp/              # Trang xác thực OTP
│   └── dashboard/               # Dashboard (protected)
│       ├── layout.tsx           # Dashboard layout
│       ├── users/               # Quản lý users
│       ├── files/               # Quản lý files
│       └── change-password/     # Đổi mật khẩu
├── components/                   # Reusable components
│   ├── ProtectedRoute.tsx       # HOC bảo vệ routes
│   └── DashboardLayout.tsx      # Layout cho dashboard
├── contexts/                     # React Contexts
│   └── AuthContext.tsx          # Auth state management
├── lib/                         # Utilities
│   ├── axios.ts                 # Axios instance với interceptors
│   └── auth.ts                  # Auth helpers (tokens)
├── types/                       # TypeScript types
│   └── index.ts                 # Shared types
└── .env.local                   # Environment variables
```

## 🔐 Luồng Authentication

### 1. Đăng Ký (Register)
- User nhập: name, email, password
- Backend tạo tài khoản và gửi OTP qua email
- Redirect đến trang verify-otp

### 2. Xác Thực OTP
- User nhập mã OTP 6 số
- Backend verify OTP
- Nếu thành công: lưu tokens và redirect đến dashboard
- Có nút "Gửi lại OTP" với countdown 60s

### 3. Đăng Nhập (Login)
- User nhập email, password
- Kiểm tra isEmailVerified:
  - Nếu false: redirect đến verify-otp
  - Nếu true: lưu tokens và redirect đến dashboard

### 4. Token Management
- **Access Token**: Lưu trong cookie, expire 1 ngày
- **Refresh Token**: Lưu trong cookie, expire 7 ngày
- Axios interceptor tự động refresh token khi 401

## 🎯 Các Tính Năng Chính

### 1. Quản Lý Users (CRUD)
**Đường dẫn**: `/dashboard/users`

**Chức năng**:
- ✅ Hiển thị danh sách users (Table)
- ✅ Thêm user mới (Modal form)
- ✅ Sửa thông tin user
- ✅ Xóa user (với confirm)
- ✅ Hiển thị role, status, ngày tạo

**API Endpoints**:
```typescript
GET    /api/users           // Lấy danh sách
POST   /api/users           // Tạo mới
PATCH  /api/users/:id       // Cập nhật
DELETE /api/users/:id       // Xóa
```

### 2. Quản Lý Files
**Đường dẫn**: `/dashboard/files`

**Chức năng**:
- ✅ Upload file (Ant Design Upload)
- ✅ Hiển thị danh sách files
- ✅ Preview ảnh (Modal)
- ✅ Download file
- ✅ Xóa file
- ✅ Hiển thị: tên, loại, kích thước, ngày upload

**API Endpoints**:
```typescript
POST   /api/files/upload    // Upload
GET    /api/files           // Lấy danh sách
GET    /api/files/:id       // Download
DELETE /api/files/:id       // Xóa
```

### 3. Đổi Mật Khẩu
**Đường dẫn**: `/dashboard/change-password`

**Chức năng**:
- ✅ Form đổi mật khẩu
- ✅ Validate: mật khẩu hiện tại, mật khẩu mới, xác nhận
- ✅ Hiển thị thông báo thành công/thất bại

**API Endpoint**:
```typescript
POST /api/auth/change-password
```

## 🛡️ Protected Routes

Sử dụng `ProtectedRoute` component:
```tsx
<ProtectedRoute>
  <DashboardLayout>
    {children}
  </DashboardLayout>
</ProtectedRoute>
```

**Cơ chế**:
1. Check user từ AuthContext
2. Nếu loading: hiển thị Spin
3. Nếu không có user: redirect về /login
4. Nếu có user: render children

## 🎨 UI/UX Features

### Ant Design Components Sử Dụng
- **Form**: Validation, layout vertical
- **Table**: Pagination, sorting, actions
- **Modal**: Add/Edit forms, preview
- **Upload**: Drag & drop, progress
- **Message**: Toast notifications
- **Card**: Container cho forms
- **Button**: Primary, link, danger
- **Tag**: Status, role badges
- **Dropdown**: User menu
- **Layout**: Sider, Header, Content

### Tailwind CSS
- Responsive design
- Gradient backgrounds
- Spacing utilities
- Flex layouts

## 🔄 State Management

### AuthContext
```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}
```

**Sử dụng**:
```tsx
const { user, loading, setUser, logout } = useAuth();
```

## 📡 API Integration

### Axios Instance
```typescript
// lib/axios.ts
- Base URL từ env
- Request interceptor: thêm Bearer token
- Response interceptor: auto refresh token
```

### Error Handling
```typescript
try {
  const response = await axiosInstance.get('/users');
  // Success
} catch (error: any) {
  message.error(error.response?.data?.message || 'Lỗi!');
}
```

## 🎯 Best Practices Đã Áp Dụng

### 1. TypeScript
- Định nghĩa types cho User, File, API responses
- Type-safe props và state

### 2. Form Validation
- Ant Design Form rules
- Custom validators
- Error messages tiếng Việt

### 3. Loading States
- Button loading
- Table loading
- Page loading (Spin)

### 4. User Feedback
- Success messages
- Error messages
- Confirm dialogs

### 5. Security
- Protected routes
- Token refresh
- Logout on 401

## 🚀 Deployment

### Build Production
```bash
npm run build
npm start
```

### Environment Variables
```env
NEXT_PUBLIC_API_URL=https://your-api.com/api
```

## 📝 Các Trang và Routes

| Route | Mô Tả | Protected |
|-------|-------|-----------|
| `/` | Home (redirect) | ❌ |
| `/login` | Đăng nhập | ❌ |
| `/register` | Đăng ký | ❌ |
| `/verify-otp` | Xác thực OTP | ❌ |
| `/dashboard` | Dashboard chính | ✅ |
| `/dashboard/users` | Quản lý users | ✅ |
| `/dashboard/files` | Quản lý files | ✅ |
| `/dashboard/change-password` | Đổi mật khẩu | ✅ |

## 🎓 Kiến Thức Học Được

### Next.js 16 App Router
- Server Components vs Client Components
- Layout và nested layouts
- useRouter, useSearchParams hooks
- Metadata API

### React 19
- useState, useEffect hooks
- Context API
- Custom hooks (useAuth)
- Suspense

### Ant Design
- Form handling
- Table với pagination
- Modal dialogs
- Upload component
- Message notifications

### TypeScript
- Interface definitions
- Type safety
- Generic types

### State Management
- Context API
- Local state
- Cookie management

## 🔧 Troubleshooting

### Lỗi CORS
Đảm bảo backend có cấu hình CORS cho frontend URL

### Token Expired
Axios interceptor sẽ tự động refresh, nếu không được sẽ redirect về login

### Upload File Lỗi
Kiểm tra:
- Token trong header
- File size limit
- MIME type allowed

## 📚 Tài Liệu Tham Khảo

- [Next.js Docs](https://nextjs.org/docs)
- [Ant Design](https://ant.design/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Axios](https://axios-http.com/)

---

**Chúc bạn code vui vẻ! 🎉**
