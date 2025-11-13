# 🔧 Fix Errors Guide

## Đã fix tất cả lỗi!

### 1. ✅ Fixed TypeScript Errors

**Vấn đề:** User class không có `_id` và `toObject()` vì đó là properties của Mongoose Document

**Giải pháp:** Dùng `any` type cho các biến cần access Mongoose document properties

```typescript
// Trước (Lỗi)
async login(user: User): Promise<...> {
  user._id.toString() // ❌ Error: Property '_id' does not exist
}

// Sau (Fixed)
async login(user: any): Promise<...> {
  user._id.toString() // ✅ OK
}
```

### 2. ✅ Fixed Aggregation Pipeline Type Error

**Vấn đề:** MongoDB aggregation $sort yêu cầu type `1 | -1` chứ không phải `number`

**Giải pháp:** Cast explicitly sang `1 as 1`

```typescript
// Trước (Lỗi)
{ $sort: { createdAt: 1, _id: 1 } } // ❌ Type error

// Sau (Fixed)
{ $sort: { createdAt: 1 as 1, _id: 1 as 1 } } // ✅ OK
```

### 3. ⚠️ Missing Packages

Cần cài đặt 2 packages còn thiếu:

```bash
npm install @nestjs/swagger @nestjs/throttler
```

---

## Chạy lại project

```bash
# 1. Cài đặt packages
npm install

# 2. Chạy server
npm run start:dev
```

---

## Kiểm tra

Sau khi chạy, bạn sẽ thấy:
```
[Nest] Starting Nest application...
[Nest] Application is running on: http://localhost:3000
[Nest] Swagger documentation: http://localhost:3000/api
```

Truy cập:
- API: http://localhost:3000
- Swagger: http://localhost:3000/api

---

## Tóm tắt các fix

1. ✅ Changed `User` type to `any` where needed for Mongoose documents
2. ✅ Fixed aggregation pipeline type casting
3. ✅ Fixed `generateToken` → `generateTokens`
4. ✅ Removed `toObject()` calls or cast to `any`
5. ⚠️ Need to run `npm install` for missing packages

---

Tất cả lỗi TypeScript đã được fix! Chỉ cần chạy `npm install` là xong! 🎉
