# 🔗 MongoDB $lookup - JOIN Collections

## $lookup là gì?

**$lookup** = JOIN trong SQL = Lấy dữ liệu từ collection khác

### So sánh với SQL:
```sql
-- SQL
SELECT users.*, files.*
FROM users
LEFT JOIN files ON users._id = files.uploadedBy
```

```javascript
// MongoDB Aggregation
db.users.aggregate([
  {
    $lookup: {
      from: "files",
      localField: "_id",
      foreignField: "uploadedBy",
      as: "uploadedFiles"
    }
  }
])
```

---

## 🎯 Ví Dụ Thực Tế Trong Project

### Use Case: Lấy User kèm Files đã upload

**Mục tiêu:** Khi lấy thông tin user, muốn biết user đó đã upload những file nào

**Collections:**
```javascript
// Collection: users
{
  _id: ObjectId("user1"),
  name: "Nguyễn Văn An",
  email: "an@test.com"
}

// Collection: files
{
  _id: ObjectId("file1"),
  filename: "avatar.jpg",
  uploadedBy: ObjectId("user1")  // ← Liên kết với users._id
}
```

---

## 📝 Cú Pháp $lookup

```javascript
{
  $lookup: {
    from: "collection_name",      // Collection muốn join
    localField: "field_in_current", // Field trong collection hiện tại
    foreignField: "field_in_other", // Field trong collection khác
    as: "result_array_name"       // Tên mảng kết quả
  }
}
```

---

## 🚀 Implementation Trong Project

### 1. Lấy User với Files đã upload

**File:** `src/users/users.repository.ts`

```typescript
// Thêm method mới
async findUserWithFiles(userId: string): Promise<any> {
  return await this.userModel.aggregate([
    // Bước 1: Lọc user theo ID
    {
      $match: { _id: new Types.ObjectId(userId) }
    },
    
    // Bước 2: JOIN với collection files
    {
      $lookup: {
        from: "files",              // Collection files
        localField: "_id",          // users._id
        foreignField: "uploadedBy", // files.uploadedBy
        as: "uploadedFiles"         // Kết quả lưu vào uploadedFiles
      }
    },
    
    // Bước 3: Thêm thông tin tổng hợp
    {
      $addFields: {
        totalFiles: { $size: "$uploadedFiles" },
        totalSize: { $sum: "$uploadedFiles.size" }
      }
    },
    
    // Bước 4: Loại bỏ password
    {
      $project: {
        password: 0,
        refreshToken: 0
      }
    }
  ]).exec();
}
```

**Kết quả:**
```javascript
{
  _id: ObjectId("user1"),
  name: "Nguyễn Văn An",
  email: "an@test.com",
  uploadedFiles: [
    {
      _id: ObjectId("file1"),
      filename: "avatar.jpg",
      size: 123456,
      uploadedBy: ObjectId("user1")
    },
    {
      _id: ObjectId("file2"),
      filename: "photo.png",
      size: 234567,
      uploadedBy: ObjectId("user1")
    }
  ],
  totalFiles: 2,
  totalSize: 358023
}
```

---

### 2. Lấy File với thông tin User

**File:** `src/upload/upload.repository.ts`

```typescript
// Thêm method mới
async findFileWithUser(fileId: string): Promise<any> {
  return await this.fileModel.aggregate([
    // Bước 1: Lọc file theo ID
    {
      $match: { _id: new Types.ObjectId(fileId) }
    },
    
    // Bước 2: JOIN với collection users
    {
      $lookup: {
        from: "users",              // Collection users
        localField: "uploadedBy",   // files.uploadedBy
        foreignField: "_id",        // users._id
        as: "uploader"              // Kết quả lưu vào uploader
      }
    },
    
    // Bước 3: Unwind (chuyển array thành object)
    {
      $unwind: {
        path: "$uploader",
        preserveNullAndEmptyArrays: false
      }
    },
    
    // Bước 4: Loại bỏ password của user
    {
      $project: {
        "uploader.password": 0,
        "uploader.refreshToken": 0
      }
    }
  ]).exec();
}
```

**Kết quả:**
```javascript
{
  _id: ObjectId("file1"),
  filename: "avatar.jpg",
  size: 123456,
  uploadedBy: ObjectId("user1"),
  uploader: {  // ← Thông tin user
    _id: ObjectId("user1"),
    name: "Nguyễn Văn An",
    email: "an@test.com"
  }
}
```

---

## 🔍 Giải Thích $unwind

### Trước $unwind:
```javascript
{
  filename: "avatar.jpg",
  uploader: [  // ← Array (vì $lookup luôn trả về array)
    {
      name: "Nguyễn Văn An",
      email: "an@test.com"
    }
  ]
}
```

### Sau $unwind:
```javascript
{
  filename: "avatar.jpg",
  uploader: {  // ← Object (không còn array)
    name: "Nguyễn Văn An",
    email: "an@test.com"
  }
}
```

**Tại sao cần $unwind?**
- $lookup luôn trả về **array** (ngay cả khi chỉ có 1 kết quả)
- $unwind chuyển array thành object (dễ dùng hơn)

**Options:**
```javascript
{
  $unwind: {
    path: "$uploader",
    preserveNullAndEmptyArrays: false  // false = Bỏ qua nếu không có uploader
                                       // true = Giữ lại ngay cả khi uploader = []
  }
}
```

---

## 💼 Use Cases Thực Tế

### Use Case 1: Dashboard - Thống kê User

**Mục tiêu:** Hiển thị danh sách users với số lượng files đã upload

```typescript
async getUsersWithFileStats(): Promise<any[]> {
  return await this.userModel.aggregate([
    // JOIN với files
    {
      $lookup: {
        from: "files",
        localField: "_id",
        foreignField: "uploadedBy",
        as: "files"
      }
    },
    
    // Tính toán thống kê
    {
      $addFields: {
        totalFiles: { $size: "$files" },
        totalSize: { $sum: "$files.size" },
        totalSizeMB: { 
          $round: [{ $divide: [{ $sum: "$files.size" }, 1048576] }, 2] 
        }
      }
    },
    
    // Chỉ lấy fields cần thiết
    {
      $project: {
        name: 1,
        email: 1,
        totalFiles: 1,
        totalSize: 1,
        totalSizeMB: 1,
        createdAt: 1
      }
    },
    
    // Sắp xếp theo số files giảm dần
    {
      $sort: { totalFiles: -1 }
    }
  ]).exec();
}
```

**Kết quả:**
```javascript
[
  {
    _id: ObjectId("user1"),
    name: "Nguyễn Văn An",
    email: "an@test.com",
    totalFiles: 15,
    totalSize: 5242880,
    totalSizeMB: 5.0,
    createdAt: "2024-11-13T10:00:00.000Z"
  },
  {
    _id: ObjectId("user2"),
    name: "Trần Thị Bình",
    email: "binh@test.com",
    totalFiles: 8,
    totalSize: 2097152,
    totalSizeMB: 2.0,
    createdAt: "2024-11-13T11:00:00.000Z"
  }
]
```

---

### Use Case 2: File Gallery - Hiển thị files với thông tin uploader

**Mục tiêu:** Hiển thị gallery files kèm tên người upload

```typescript
async getFilesGallery(page: number = 1, limit: number = 20): Promise<any> {
  const skip = (page - 1) * limit;
  
  const files = await this.fileModel.aggregate([
    // Chỉ lấy files active
    {
      $match: { status: "active" }
    },
    
    // JOIN với users
    {
      $lookup: {
        from: "users",
        localField: "uploadedBy",
        foreignField: "_id",
        as: "uploader"
      }
    },
    
    // Unwind uploader
    {
      $unwind: {
        path: "$uploader",
        preserveNullAndEmptyArrays: true
      }
    },
    
    // Chỉ lấy fields cần thiết
    {
      $project: {
        filename: 1,
        originalName: 1,
        size: 1,
        mimetype: 1,
        createdAt: 1,
        "uploader.name": 1,
        "uploader.email": 1
      }
    },
    
    // Sắp xếp mới nhất trước
    {
      $sort: { createdAt: -1 }
    },
    
    // Pagination
    {
      $skip: skip
    },
    {
      $limit: limit
    }
  ]).exec();
  
  const total = await this.fileModel.countDocuments({ status: "active" });
  
  return {
    files,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}
```

---

### Use Case 3: Multiple Lookups - User với Files và Roles

**Mục tiêu:** Lấy user với files đã upload và roles (nếu có collection roles riêng)

```typescript
async getUserComplete(userId: string): Promise<any> {
  return await this.userModel.aggregate([
    {
      $match: { _id: new Types.ObjectId(userId) }
    },
    
    // Lookup 1: Files
    {
      $lookup: {
        from: "files",
        localField: "_id",
        foreignField: "uploadedBy",
        as: "files"
      }
    },
    
    // Lookup 2: Roles (giả sử có collection roles)
    {
      $lookup: {
        from: "roles",
        localField: "roles",
        foreignField: "_id",
        as: "roleDetails"
      }
    },
    
    // Thêm thống kê
    {
      $addFields: {
        totalFiles: { $size: "$files" },
        totalSize: { $sum: "$files.size" },
        recentFiles: { $slice: ["$files", 5] } // 5 files gần nhất
      }
    },
    
    // Loại bỏ sensitive data
    {
      $project: {
        password: 0,
        refreshToken: 0,
        "files.path": 0
      }
    }
  ]).exec();
}
```

---

## 🎨 Advanced: Nested Lookup

**Mục tiêu:** Lấy user → files → comments trên files (3 levels)

```typescript
async getUserWithFilesAndComments(userId: string): Promise<any> {
  return await this.userModel.aggregate([
    {
      $match: { _id: new Types.ObjectId(userId) }
    },
    
    // Level 1: Lookup files
    {
      $lookup: {
        from: "files",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$uploadedBy", "$$userId"] }
            }
          },
          
          // Level 2: Lookup comments cho mỗi file
          {
            $lookup: {
              from: "comments",
              localField: "_id",
              foreignField: "fileId",
              as: "comments"
            }
          },
          
          // Thêm số lượng comments
          {
            $addFields: {
              commentCount: { $size: "$comments" }
            }
          }
        ],
        as: "files"
      }
    }
  ]).exec();
}
```

---

## 📊 Performance Tips

### 1. Index cho Foreign Keys
```javascript
// Tạo index cho fields dùng trong $lookup
db.files.createIndex({ uploadedBy: 1 })
db.users.createIndex({ _id: 1 })
```

### 2. Limit trước khi Lookup
```javascript
// ✅ TỐT: Filter trước
{
  $match: { status: "active" }  // Giảm số documents
},
{
  $lookup: { ... }  // Lookup ít documents hơn
}

// ❌ KHÔNG TỐT: Lookup hết rồi mới filter
{
  $lookup: { ... }  // Lookup tất cả
},
{
  $match: { status: "active" }  // Filter sau
}
```

### 3. Project chỉ fields cần thiết
```javascript
{
  $project: {
    name: 1,
    email: 1,
    "files.filename": 1,  // Chỉ lấy filename, không lấy hết
    "files.size": 1
  }
}
```

---

## 🔧 Code Implementation Đầy Đủ

Tôi sẽ tạo các files code thực tế cho bạn...
