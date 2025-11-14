# 🚀 Hướng Dẫn Đẩy Code Lên GitHub

## Bước 1: Kiểm tra Git đã cài chưa

```bash
git --version
```

Nếu chưa có, tải tại: https://git-scm.com/downloads

---

## Bước 2: Cấu hình Git (Lần đầu tiên)

```bash
# Cấu hình tên
git config --global user.name "Tên của bạn"

# Cấu hình email
git config --global user.email "email@example.com"

# Kiểm tra
git config --list
```

---

## Bước 3: Khởi tạo Git trong project

```bash
# Di chuyển vào thư mục project (nếu chưa ở đó)
cd D:\BACKEND

# Khởi tạo git
git init

# Kiểm tra status
git status
```

**Kết quả:** Sẽ thấy nhiều file màu đỏ (chưa được track)

---

## Bước 4: Tạo .gitignore (Quan trọng!)

File `.gitignore` đã có sẵn trong project, nhưng cần thêm:

```bash
# Kiểm tra .gitignore
type .gitignore
```

Nếu chưa có, tôi sẽ tạo cho bạn...

---

## Bước 5: Add files vào Git

```bash
# Add tất cả files
git add .

# Hoặc add từng file
git add src/
git add package.json
git add README.md

# Kiểm tra
git status
```

**Kết quả:** Files sẽ chuyển sang màu xanh (đã staged)

---

## Bước 6: Commit (Lưu snapshot)

```bash
# Commit với message
git commit -m "Initial commit: NestJS backend with auth, upload, mongodb"

# Hoặc message chi tiết hơn
git commit -m "feat: Complete NestJS backend

- Authentication & Authorization (JWT, Roles)
- MongoDB integration with Mongoose
- File upload with Multer
- Validation with class-validator
- Swagger documentation
- Rate limiting
- Repository pattern
- $lookup aggregation"
```

---

## Bước 7: Kết nối với GitHub Repository

Từ ảnh bạn gửi, URL repo là:
```
https://github.com/thanhdanh14/backend-nestjs-kiro.git
```

```bash
# Thêm remote origin
git remote add origin https://github.com/thanhdanh14/backend-nestjs-kiro.git

# Kiểm tra
git remote -v
```

**Kết quả:**
```
origin  https://github.com/thanhdanh14/backend-nestjs-kiro.git (fetch)
origin  https://github.com/thanhdanh14/backend-nestjs-kiro.git (push)
```

---

## Bước 8: Đẩy code lên GitHub

```bash
# Đổi tên branch thành main (nếu đang là master)
git branch -M main

# Push lên GitHub
git push -u origin main
```

**Lưu ý:** Lần đầu push sẽ yêu cầu đăng nhập GitHub

---

## Bước 9: Xác thực GitHub

### Cách 1: Personal Access Token (Khuyến nghị)

1. Vào GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Chọn scopes: `repo` (full control)
4. Copy token: `ghp_abc123xyz...`
5. Khi push, dùng token làm password:
   ```
   Username: thanhdanh14
   Password: ghp_abc123xyz...
   ```

### Cách 2: GitHub CLI

```bash
# Cài GitHub CLI
winget install GitHub.cli

# Login
gh auth login

# Push
git push -u origin main
```

---

## Bước 10: Kiểm tra trên GitHub

Mở browser:
```
https://github.com/thanhdanh14/backend-nestjs-kiro
```

Bạn sẽ thấy tất cả code đã lên! 🎉

---

## 📝 Các Lệnh Git Thường Dùng

### Sau khi đã setup:

```bash
# 1. Kiểm tra thay đổi
git status

# 2. Add files mới/đã sửa
git add .

# 3. Commit
git commit -m "feat: Add new feature"

# 4. Push lên GitHub
git push

# 5. Pull code mới từ GitHub
git pull

# 6. Xem lịch sử commits
git log

# 7. Xem branches
git branch

# 8. Tạo branch mới
git checkout -b feature/new-feature

# 9. Chuyển branch
git checkout main

# 10. Merge branch
git merge feature/new-feature
```

---

## 🎯 Commit Message Convention

### Format:
```
<type>: <description>

[optional body]
```

### Types:
- `feat:` - Feature mới
- `fix:` - Fix bug
- `docs:` - Cập nhật documentation
- `style:` - Format code (không ảnh hưởng logic)
- `refactor:` - Refactor code
- `test:` - Thêm tests
- `chore:` - Cập nhật dependencies, config

### Ví dụ:
```bash
git commit -m "feat: Add user authentication with JWT"
git commit -m "fix: Fix file upload validation"
git commit -m "docs: Update README with API endpoints"
git commit -m "refactor: Extract repository pattern"
```

---

## 🔒 Bảo Mật

### QUAN TRỌNG: Không commit sensitive data!

**Tạo file `.env` cho secrets:**
```bash
# .env
JWT_SECRET=your_secret_key_here
MONGODB_URI=mongodb://localhost:27017/nestjs-learning
```

**Thêm vào .gitignore:**
```
.env
.env.local
.env.production
```

**Dùng trong code:**
```typescript
// app.module.ts
MongooseModule.forRoot(process.env.MONGODB_URI)

// auth.module.ts
JwtModule.register({
  secret: process.env.JWT_SECRET,
})
```

---

## 🌿 Git Workflow

### Workflow cơ bản:

```
1. Tạo branch mới
   git checkout -b feature/upload-file

2. Code feature

3. Commit thường xuyên
   git add .
   git commit -m "feat: Add file upload"

4. Push branch
   git push origin feature/upload-file

5. Tạo Pull Request trên GitHub

6. Review → Merge vào main

7. Pull code mới về
   git checkout main
   git pull
```

---

## 🐛 Troubleshooting

### Lỗi: "fatal: remote origin already exists"
```bash
# Xóa remote cũ
git remote remove origin

# Thêm lại
git remote add origin https://github.com/thanhdanh14/backend-nestjs-kiro.git
```

### Lỗi: "Updates were rejected"
```bash
# Pull trước khi push
git pull origin main --rebase

# Rồi push
git push origin main
```

### Lỗi: "Authentication failed"
```bash
# Dùng Personal Access Token thay vì password
# Hoặc dùng GitHub CLI
gh auth login
```

### Lỗi: "Large files"
```bash
# Xóa file lớn khỏi git
git rm --cached uploads/*

# Thêm vào .gitignore
echo "uploads/" >> .gitignore

# Commit
git commit -m "chore: Remove uploaded files from git"
```

---

## 📚 Tóm tắt Commands

```bash
# Setup (Lần đầu)
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/thanhdanh14/backend-nestjs-kiro.git
git branch -M main
git push -u origin main

# Hàng ngày
git add .
git commit -m "feat: Add new feature"
git push

# Làm việc nhóm
git pull                          # Lấy code mới
git checkout -b feature/my-feature # Tạo branch
git add .
git commit -m "feat: My feature"
git push origin feature/my-feature # Push branch
# Tạo Pull Request trên GitHub
```

---

## 🎓 Best Practices

1. **Commit thường xuyên** - Mỗi feature nhỏ = 1 commit
2. **Message rõ ràng** - Người khác đọc hiểu ngay
3. **Không commit node_modules** - Đã có trong .gitignore
4. **Không commit .env** - Secrets không được public
5. **Không commit uploads/** - Files lớn
6. **Pull trước khi push** - Tránh conflict
7. **Dùng branches** - Không code trực tiếp trên main

---

Chúc bạn thành công! 🚀
