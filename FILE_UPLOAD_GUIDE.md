# 📤 File Upload với NestJS

## File Upload là gì?

**File Upload** = Cho phép user upload files (ảnh, video, documents) lên server

### Use Cases
- 📷 Upload avatar
- 🖼️ Upload photos
- 📄 Upload documents (PDF, Word)
- 🎵 Upload audio/video
- 📦 Upload files bất kỳ

---

## Setup File Upload

### 1. Cài đặt
```bash
npm install multer
npm install -D @types/multer
```

**Multer** = Middleware xử lý `multipart/form-data` (file upload)

### 2. Tạo thư mục uploads
```bash
mkdir uploads
```

### 3. Thêm vào .gitignore
```
/uploads
```

---

## Upload 1 File

### Controller
```typescript
@Post('single')
@UseInterceptors(
  FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `file-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, callback) => {
      // Chỉ chấp nhận ảnh
      if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        callback(null, true);
      } else {
        callback(new BadRequestException('Chỉ chấp nhận file ảnh'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }),
)
uploadSingle(@UploadedFile() file: Express.Multer.File) {
  return {
    filename: file.filename,
    path: file.path,
    size: file.size,
  };
}
```

### Test với cURL
```bash
curl -X POST http://localhost:3000/upload/single \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/image.jpg"
```

### Test với Postman
1. Method: POST
2. URL: http://localhost:3000/upload/single
3. Headers: Authorization: Bearer <token>
4. Body: form-data
   - Key: file (type: File)
   - Value: Chọn file

---

## Upload Nhiều Files

### Controller
```typescript
@Post('multiple')
@UseInterceptors(
  FilesInterceptor('files', 10, {
    // 'files' = field name
    // 10 = max files
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `file-${uniqueSuffix}${ext}`);
      },
    }),
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  }),
)
uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
  return {
    count: files.length,
    files: files.map(f => ({
      filename: f.filename,
      size: f.size,
    })),
  };
}
```

### Test
```bash
curl -X POST http://localhost:3000/upload/multiple \
  -H "Authorization: Bearer <token>" \
  -F "files=@image1.jpg" \
  -F "files=@image2.jpg" \
  -F "files=@image3.jpg"
```

---

## Upload Nhiều Fields

### Controller
```typescript
@Post('fields')
@UseInterceptors(
  FileFieldsInterceptor([
    { name: 'avatar', maxCount: 1 },
    { name: 'photos', maxCount: 5 },
  ], {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
      },
    }),
  }),
)
uploadFields(
  @UploadedFiles() files: {
    avatar?: Express.Multer.File[];
    photos?: Express.Multer.File[];
  },
) {
  return {
    avatar: files.avatar?.[0],
    photos: files.photos,
  };
}
```

### Test
```bash
curl -X POST http://localhost:3000/upload/fields \
  -H "Authorization: Bearer <token>" \
  -F "avatar=@avatar.jpg" \
  -F "photos=@photo1.jpg" \
  -F "photos=@photo2.jpg"
```

---

## File Object Properties

```typescript
file: Express.Multer.File = {
  fieldname: 'file',              // Field name trong form
  originalname: 'image.jpg',      // Tên file gốc
  encoding: '7bit',               // Encoding
  mimetype: 'image/jpeg',         // MIME type
  destination: './uploads',       // Thư mục lưu
  filename: 'file-1699876543.jpg', // Tên file đã lưu
  path: 'uploads/file-1699876543.jpg', // Path đầy đủ
  size: 123456,                   // Size (bytes)
}
```

---

## Validation

### 1. File Type
```typescript
fileFilter: (req, file, callback) => {
  // Chỉ chấp nhận ảnh
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
  
  if (allowedMimes.includes(file.mimetype)) {
    callback(null, true); // Accept
  } else {
    callback(
      new BadRequestException('Chỉ chấp nhận file ảnh'),
      false, // Reject
    );
  }
}
```

### 2. File Size
```typescript
limits: {
  fileSize: 5 * 1024 * 1024, // 5MB
  files: 10,                  // Max 10 files
}
```

### 3. Custom Validation
```typescript
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
uploadFile(@UploadedFile() file: Express.Multer.File) {
  // Validate file extension
  const allowedExts = ['.jpg', '.jpeg', '.png'];
  const ext = extname(file.originalname).toLowerCase();
  
  if (!allowedExts.includes(ext)) {
    throw new BadRequestException('File extension không hợp lệ');
  }
  
  // Validate file name
  if (file.originalname.length > 100) {
    throw new BadRequestException('Tên file quá dài');
  }
  
  return { filename: file.filename };
}
```

---

## Serve Static Files

### 1. Cấu hình trong main.ts
```typescript
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Serve static files
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  
  await app.listen(3000);
}
```

### 2. Truy cập file
```
http://localhost:3000/uploads/file-1699876543.jpg
```

---

## Lưu File Info vào Database

### Schema
```typescript
@Schema({ timestamps: true })
export class File {
  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  path: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  mimetype: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  uploadedBy: Types.ObjectId;
}
```

### Service
```typescript
async saveFile(file: Express.Multer.File, userId: string) {
  return await this.fileModel.create({
    filename: file.filename,
    originalName: file.originalname,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype,
    uploadedBy: userId,
  });
}
```

---

## Upload lên Cloud (AWS S3, Cloudinary)

### AWS S3
```typescript
import { S3 } from 'aws-sdk';

@Injectable()
export class UploadService {
  private s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  });

  async uploadToS3(file: Express.Multer.File) {
    const params = {
      Bucket: 'my-bucket',
      Key: `${Date.now()}-${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    const result = await this.s3.upload(params).promise();
    return result.Location; // URL của file
  }
}
```

### Cloudinary
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async uploadToCloudinary(file: Express.Multer.File) {
  const result = await cloudinary.uploader.upload(file.path);
  return result.secure_url;
}
```

---

## Best Practices

### 1. Validate File Type
```typescript
// ✅ TỐT: Whitelist
const allowedMimes = ['image/jpeg', 'image/png'];
if (allowedMimes.includes(file.mimetype)) { }

// ❌ KHÔNG TỐT: Blacklist
if (file.mimetype !== 'application/exe') { }
```

### 2. Limit File Size
```typescript
// ✅ TỐT
limits: { fileSize: 5 * 1024 * 1024 } // 5MB

// ❌ KHÔNG TỐT: Không giới hạn
```

### 3. Sanitize Filename
```typescript
// ✅ TỐT: Generate unique filename
const filename = `${Date.now()}-${Math.random()}.${ext}`;

// ❌ KHÔNG TỐT: Dùng original filename
const filename = file.originalname; // Có thể bị hack
```

### 4. Scan Virus
```typescript
import * as clamav from 'clamav.js';

async scanFile(file: Express.Multer.File) {
  const isClean = await clamav.isInfected(file.path);
  if (!isClean) {
    throw new BadRequestException('File chứa virus');
  }
}
```

### 5. Compress Images
```typescript
import * as sharp from 'sharp';

async compressImage(file: Express.Multer.File) {
  await sharp(file.path)
    .resize(800, 600)
    .jpeg({ quality: 80 })
    .toFile(`compressed-${file.filename}`);
}
```

---

## Common MIME Types

```typescript
const mimeTypes = {
  // Images
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  
  // Documents
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  
  // Archives
  'application/zip': ['.zip'],
  'application/x-rar-compressed': ['.rar'],
  
  // Audio
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  
  // Video
  'video/mp4': ['.mp4'],
  'video/mpeg': ['.mpeg'],
};
```

---

## Error Handling

```typescript
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
uploadFile(@UploadedFile() file: Express.Multer.File) {
  try {
    if (!file) {
      throw new BadRequestException('Không có file nào được upload');
    }

    // Validate
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File quá lớn (max 5MB)');
    }

    // Process file
    return { filename: file.filename };
    
  } catch (error) {
    // Cleanup file nếu có lỗi
    if (file?.path) {
      fs.unlinkSync(file.path);
    }
    throw error;
  }
}
```

---

## Tóm tắt

✅ **File Upload:**
- Dùng Multer middleware
- FileInterceptor (1 file)
- FilesInterceptor (nhiều files)
- FileFieldsInterceptor (nhiều fields)

🎯 **Validation:**
- File type (mimetype)
- File size (limits)
- File extension
- Virus scan

📚 **Storage:**
- Local disk (diskStorage)
- Memory (memoryStorage)
- Cloud (S3, Cloudinary)

🔒 **Security:**
- Validate file type
- Limit file size
- Sanitize filename
- Scan virus
- Compress images

---

## API Endpoints

```
POST /upload/single          - Upload 1 file
POST /upload/multiple        - Upload nhiều files
POST /upload/fields          - Upload từ nhiều fields
GET  /upload/:filename       - Xem file
```

Chúc bạn học tốt! 🚀
