# 📡 API Endpoints Reference

## Base URL
```
http://localhost:3000/api
```

---

## 🔐 Authentication

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "string",
  "email": "string",
  "password": "string"
}

Response: {
  "message": "string",
  "email": "string"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}

Response: {
  "message": "string",
  "email": "string"
}
```

### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "string",
  "otp": "string"
}

Response: {
  "access_token": "string",
  "refresh_token": "string"
}
```

### Resend OTP
```http
POST /api/auth/resend-otp
Content-Type: application/json

{
  "email": "string"
}

Response: {
  "message": "string"
}
```

### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer {access_token}

Response: {
  "_id": "string",
  "email": "string",
  "name": "string",
  "roles": ["string"],
  "createdAt": "string",
  "updatedAt": "string"
}
```

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "string"
}

Response: {
  "access_token": "string",
  "refresh_token": "string"
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer {access_token}

Response: {
  "message": "string"
}
```

### Change Password
```http
POST /api/auth/change-password
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "currentPassword": "string",
  "newPassword": "string"
}

Response: {
  "message": "string"
}
```

---

## 👥 Users Management

### Get All Users
```http
GET /api/users
Authorization: Bearer {access_token}

Response: [
  {
    "_id": "string",
    "email": "string",
    "name": "string",
    "roles": ["string"],
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```

### Get User by ID
```http
GET /api/users/:id
Authorization: Bearer {access_token}

Response: {
  "_id": "string",
  "email": "string",
  "name": "string",
  "roles": ["string"],
  "createdAt": "string",
  "updatedAt": "string"
}
```

### Create User
```http
POST /api/users
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "string",
  "email": "string",
  "password": "string"
}

Response: {
  "_id": "string",
  "email": "string",
  "name": "string",
  "roles": ["string"]
}
```

### Update User
```http
PATCH /api/users/:id
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "string",
  "email": "string"
}

Response: {
  "_id": "string",
  "email": "string",
  "name": "string",
  "updatedAt": "string"
}
```

### Delete User
```http
DELETE /api/users/:id
Authorization: Bearer {access_token}

Response: {
  "message": "string"
}
```

---

## 📁 Files Management

### Upload File
```http
POST /api/upload/single
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

FormData:
  file: File

Response: {
  "message": "string",
  "file": {
    "id": "string",
    "originalName": "string",
    "filename": "string",
    "path": "string",
    "size": number,
    "mimetype": "string",
    "url": "string"
  },
  "uploadedBy": "string"
}
```

### Get My Files
```http
GET /api/upload/my-files
Authorization: Bearer {access_token}

Response: {
  "total": number,
  "files": [
    {
      "id": "string",
      "originalName": "string",
      "filename": "string",
      "size": number,
      "mimetype": "string",
      "url": "string",
      "uploadedAt": "string"
    }
  ]
}
```

### View/Download File
```http
GET /api/upload/view/:filename
Authorization: Bearer {access_token}

Response: File (binary)
```

### Delete File
```http
DELETE /api/upload/:id
Authorization: Bearer {access_token}

Response: {
  "message": "string"
}
```

### Upload Multiple Files
```http
POST /api/upload/multiple
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

FormData:
  files: File[]

Response: {
  "message": "string",
  "files": [
    {
      "id": "string",
      "originalName": "string",
      "filename": "string",
      "size": number,
      "url": "string"
    }
  ],
  "uploadedBy": "string"
}
```

### Get File Statistics
```http
GET /api/upload/statistics
Authorization: Bearer {access_token}

Response: {
  "totalFiles": number,
  "totalSize": number,
  "filesByType": {
    "image": number,
    "document": number,
    "video": number
  }
}
```

---

## 📋 Supported File Types

### Images
- `image/jpeg` (.jpg, .jpeg)
- `image/png` (.png)
- `image/gif` (.gif)
- `image/webp` (.webp)

### Documents
- `application/pdf` (.pdf)
- `application/msword` (.doc)
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (.docx)
- `application/vnd.ms-excel` (.xls)
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (.xlsx)
- `text/plain` (.txt)

### Media
- `video/mp4` (.mp4)
- `audio/mpeg` (.mp3)

### File Size Limit
- **Maximum**: 10MB per file

---

## 🔒 Authentication Headers

All protected endpoints require:
```http
Authorization: Bearer {access_token}
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation error message",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Email đã được sử dụng",
  "error": "Conflict"
}
```

---

## 🧪 Testing with cURL

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"123456"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

### Get Users (with token)
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Upload File
```bash
curl -X POST http://localhost:3000/api/upload/single \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/your/file.jpg"
```

---

**Happy Testing! 🎉**
