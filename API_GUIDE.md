# Hướng dẫn sử dụng API Users

## Base URL
```
http://localhost:3000
```

## Endpoints

### 1. Tạo user mới
**POST** `/users`

**Body:**
```json
{
  "name": "Nguyễn Văn A",
  "email": "nguyenvana@example.com",
  "age": 25
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Nguyễn Văn A",
  "email": "nguyenvana@example.com",
  "age": 25,
  "createdAt": "2024-11-13T10:00:00.000Z",
  "updatedAt": "2024-11-13T10:00:00.000Z"
}
```

### 2. Lấy tất cả users
**GET** `/users`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Nguyễn Văn A",
    "email": "nguyenvana@example.com",
    "age": 25,
    "createdAt": "2024-11-13T10:00:00.000Z",
    "updatedAt": "2024-11-13T10:00:00.000Z"
  }
]
```

### 3. Lấy user theo ID
**GET** `/users/:id`

**Ví dụ:** `GET /users/1`

**Response:**
```json
{
  "id": 1,
  "name": "Nguyễn Văn A",
  "email": "nguyenvana@example.com",
  "age": 25,
  "createdAt": "2024-11-13T10:00:00.000Z",
  "updatedAt": "2024-11-13T10:00:00.000Z"
}
```

### 4. Cập nhật user
**PATCH** `/users/:id`

**Ví dụ:** `PATCH /users/1`

**Body:** (chỉ cần gửi các field muốn cập nhật)
```json
{
  "name": "Nguyễn Văn B",
  "age": 26
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Nguyễn Văn B",
  "email": "nguyenvana@example.com",
  "age": 26,
  "createdAt": "2024-11-13T10:00:00.000Z",
  "updatedAt": "2024-11-13T10:05:00.000Z"
}
```

### 5. Xóa user
**DELETE** `/users/:id`

**Ví dụ:** `DELETE /users/1`

**Response:**
```json
{
  "message": "Đã xóa user với ID 1"
}
```

## Test API với cURL

### Tạo user:
```bash
curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d "{\"name\":\"Nguyễn Văn A\",\"email\":\"nguyenvana@example.com\",\"age\":25}"
```

### Lấy tất cả users:
```bash
curl http://localhost:3000/users
```

### Lấy user theo ID:
```bash
curl http://localhost:3000/users/1
```

### Cập nhật user:
```bash
curl -X PATCH http://localhost:3000/users/1 -H "Content-Type: application/json" -d "{\"name\":\"Nguyễn Văn B\"}"
```

### Xóa user:
```bash
curl -X DELETE http://localhost:3000/users/1
```

## Test với Postman hoặc Thunder Client

1. Import các request trên vào Postman/Thunder Client
2. Đảm bảo server đang chạy: `npm run start:dev`
3. Test từng endpoint theo thứ tự

## Lưu ý

- Dữ liệu hiện tại lưu trong memory, sẽ mất khi restart server
- Sau này sẽ tích hợp database thật (PostgreSQL, MongoDB, etc.)
- ID tự động tăng từ 1
