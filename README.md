# 🚀 User Management System - Full Stack

A complete **full-stack application** with NestJS backend and Next.js frontend.

## 📋 Project Structure

```
project-kiro/
├── backend/          # NestJS API
│   ├── src/
│   ├── uploads/
│   └── package.json
├── frontend/         # Next.js App
│   ├── app/
│   ├── components/
│   └── package.json
└── README.md
```

## ✨ Features

### Backend (NestJS)
- ✅ JWT Authentication with OTP
- ✅ Role-Based Access Control (RBAC)
- ✅ User Management (CRUD)
- ✅ File Upload & Management
- ✅ Email Service with Templates
- ✅ API Documentation (Swagger)
- ✅ MongoDB with Mongoose
- ✅ Cron Jobs

### Frontend (Next.js)
- ✅ Modern UI with Ant Design
- ✅ Authentication Flow (Login, Register, OTP)
- ✅ Protected Routes
- ✅ User Management Dashboard
- ✅ File Upload & Preview
- ✅ Change Password
- ✅ Responsive Design

## 🛠️ Tech Stack

### Backend
- NestJS 10.x
- MongoDB + Mongoose
- Passport + JWT
- Multer (File Upload)
- Nodemailer (Email)
- Swagger (API Docs)

### Frontend
- Next.js 16
- React 19
- TypeScript
- Ant Design 5
- Tailwind CSS
- Axios

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your settings
npm run start:dev
```

Backend runs on: http://localhost:3000
Swagger docs: http://localhost:3000/docs

### Frontend Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local
npm run dev
```

Frontend runs on: http://localhost:3001

## 📚 Documentation

- [Backend Learning Roadmap](backend/LEARNING_ROADMAP.md)
- [Advanced Features](backend/ADVANCED_FEATURES.md)
- [Redis Caching Guide](backend/REDIS_CACHING_GUIDE.md)
- [Frontend Guide](frontend/FRONTEND_GUIDE.md)
- [Auth Flow](frontend/AUTH_FLOW.md)
- [API Endpoints](frontend/API_ENDPOINTS.md)
- [Project Summary](PROJECT_SUMMARY.md)

## 🔐 Default Credentials

After seeding database:
```
Email: admin@example.com
Password: 123456
```

## 📸 Screenshots

### Login Page
![Login](screenshots/login.png)

### Dashboard
![Dashboard](screenshots/dashboard.png)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Thanh Danh**
- GitHub: [@thanhdanh14](https://github.com/thanhdanh14)

## 🙏 Acknowledgments

- NestJS Documentation
- Next.js Documentation
- Ant Design Team

---

**Happy Coding! 🎉**
