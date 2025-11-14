# 📝 Git Commands - Push Full Stack to GitHub

## 🎯 Mục Tiêu
Push cả backend và frontend lên GitHub repo: `backend-nestjs-kiro`

## 📋 Step-by-Step Commands

### Step 1: Initialize Git (nếu chưa có)
```bash
# Check if git is initialized
git status

# If not, initialize
git init
```

### Step 2: Add Remote Repository
```bash
# Add your GitHub repo
git remote add origin https://github.com/thanhdanh14/backend-nestjs-kiro.git

# Verify remote
git remote -v
```

### Step 3: Pull Existing Backend Code
```bash
# Pull existing backend code
git pull origin main --allow-unrelated-histories

# If conflict, resolve and commit
```

### Step 4: Add All Files
```bash
# Add all files
git add .

# Check what will be committed
git status
```

### Step 5: Commit Changes
```bash
git commit -m "feat: add frontend Next.js + complete documentation

- Add Next.js 16 frontend with Ant Design
- Implement authentication flow (Login, Register, OTP)
- Add user management dashboard
- Add file upload and management
- Add comprehensive documentation
- Add Redis caching guide
- Add learning roadmap and checklists"
```

### Step 6: Push to GitHub
```bash
# Push to main branch
git push origin main

# If error, force push (careful!)
git push origin main --force
```

## 🔄 Alternative: Create New Branch
```bash
# Create and switch to new branch
git checkout -b feature/add-frontend

# Add and commit
git add .
git commit -m "feat: add frontend and documentation"

# Push new branch
git push origin feature/add-frontend

# Then create Pull Request on GitHub
```

## 📊 Project Structure After Push
```
backend-nestjs-kiro/
├── backend/
│   ├── src/
│   ├── uploads/
│   ├── package.json
│   └── ...
├── frontend/
│   ├── app/
│   ├── components/
│   ├── package.json
│   └── ...
├── .gitignore
├── README.md
├── PROJECT_SUMMARY.md
├── LEARNING_CHECKLIST.md
└── GIT_COMMANDS.md
```

## ⚠️ Important Notes

### Files to Ignore
Already in `.gitignore`:
- `node_modules/`
- `.env` files
- `uploads/` folder
- `.next/` build folder
- `dist/` build folder

### Sensitive Data
Make sure NOT to commit:
- ❌ `.env` files
- ❌ `node_modules/`
- ❌ Uploaded files
- ❌ API keys
- ❌ Database credentials

### Large Files
If you have large files:
```bash
# Use Git LFS
git lfs install
git lfs track "*.psd"
git add .gitattributes
```

## 🔧 Common Issues & Solutions

### Issue 1: "fatal: refusing to merge unrelated histories"
```bash
git pull origin main --allow-unrelated-histories
```

### Issue 2: "Updates were rejected"
```bash
# Pull first
git pull origin main --rebase

# Then push
git push origin main
```

### Issue 3: "Large files detected"
```bash
# Remove from git cache
git rm --cached path/to/large/file

# Add to .gitignore
echo "path/to/large/file" >> .gitignore

# Commit
git commit -m "Remove large file"
```

### Issue 4: "Permission denied"
```bash
# Use HTTPS with token
git remote set-url origin https://YOUR_TOKEN@github.com/thanhdanh14/backend-nestjs-kiro.git

# Or use SSH
git remote set-url origin git@github.com:thanhdanh14/backend-nestjs-kiro.git
```

## 📝 Useful Git Commands

### Check Status
```bash
git status
git log --oneline
git branch -a
```

### Undo Changes
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Discard local changes
git checkout -- .
```

### Branch Management
```bash
# List branches
git branch -a

# Create branch
git checkout -b feature/new-feature

# Switch branch
git checkout main

# Delete branch
git branch -d feature/old-feature
```

### View Changes
```bash
# See what changed
git diff

# See staged changes
git diff --staged

# See commit history
git log --graph --oneline --all
```

## 🎯 Recommended Workflow

### For New Features
```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes
# ... code ...

# 3. Commit
git add .
git commit -m "feat: add new feature"

# 4. Push
git push origin feature/new-feature

# 5. Create Pull Request on GitHub
# 6. Merge after review
```

### For Bug Fixes
```bash
# 1. Create fix branch
git checkout -b fix/bug-description

# 2. Fix bug
# ... code ...

# 3. Commit
git add .
git commit -m "fix: resolve bug description"

# 4. Push
git push origin fix/bug-description
```

## 📚 Commit Message Convention

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

### Examples
```bash
git commit -m "feat(auth): add OTP verification"
git commit -m "fix(upload): resolve file size validation"
git commit -m "docs: update README with setup instructions"
git commit -m "refactor(users): improve service structure"
```

## 🔐 GitHub Personal Access Token

If using HTTPS, create token:
1. GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. Generate new token
4. Select scopes: `repo`, `workflow`
5. Copy token
6. Use in git commands:
```bash
git remote set-url origin https://YOUR_TOKEN@github.com/thanhdanh14/backend-nestjs-kiro.git
```

## ✅ Final Checklist

Before pushing:
- [ ] `.gitignore` is configured
- [ ] No `.env` files in commit
- [ ] No `node_modules/` in commit
- [ ] README.md is updated
- [ ] All tests pass
- [ ] Code is formatted
- [ ] Commit message is clear

---

**Ready to push! 🚀**
