# ⏰ Hướng Dẫn Cron Job - Tự Động Gửi Email

## 📋 Mục Lục
1. [Cài Đặt](#cài-đặt)
2. [Cấu Trúc Module](#cấu-trúc-module)
3. [Cron Expression](#cron-expression)
4. [Các Ví Dụ Cron Job](#các-ví-dụ-cron-job)
5. [Testing](#testing)

---

## 🚀 Cài Đặt

### Bước 1: Cài đặt package
```bash
npm install @nestjs/schedule
```

### Bước 2: Import ScheduleModule vào AppModule
Đã được thêm vào `app.module.ts`:
```typescript
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(), // ← Đã thêm
    // ...
  ],
})
```

---

## 🏗️ Cấu Trúc Module

```
src/tasks/
├── tasks.module.ts      # Module chính
└── tasks.service.ts     # Service chứa các cron jobs
```

---

## 📅 Cron Expression

Cron expression có format: `* * * * * *`

```
┌────────────── giây (0-59) - optional
│ ┌──────────── phút (0-59)
│ │ ┌────────── giờ (0-23)
│ │ │ ┌──────── ngày trong tháng (1-31)
│ │ │ │ ┌────── tháng (1-12)
│ │ │ │ │ ┌──── ngày trong tuần (0-7, 0 và 7 là Chủ nhật)
│ │ │ │ │ │
* * * * * *
```

### Ví Dụ Phổ Biến:

| Expression | Mô Tả |
|------------|-------|
| `*/2 * * * *` | Mỗi 2 phút |
| `*/5 * * * *` | Mỗi 5 phút |
| `0 * * * *` | Mỗi giờ (phút 0) |
| `0 9 * * *` | 9h sáng mỗi ngày |
| `0 0 * * *` | 12h đêm mỗi ngày |
| `0 9 * * 1` | 9h sáng thứ 2 hàng tuần |
| `0 0 1 * *` | 12h đêm ngày 1 mỗi tháng |
| `*/30 * * * * *` | Mỗi 30 giây |

### Hoặc dùng CronExpression (dễ đọc hơn):

```typescript
import { CronExpression } from '@nestjs/schedule';

@Cron(CronExpression.EVERY_30_SECONDS)
@Cron(CronExpression.EVERY_MINUTE)
@Cron(CronExpression.EVERY_5_MINUTES)
@Cron(CronExpression.EVERY_HOUR)
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
@Cron(CronExpression.EVERY_WEEK)
@Cron(CronExpression.EVERY_MONTH)
```

---

## 🔧 Các Ví Dụ Cron Job

### 1. Gửi Email Mỗi 2 Phút (Đang Chạy)

```typescript
@Cron('*/2 * * * *')
async handleCronEvery2Minutes() {
  this.logger.log('🕐 Cron job chạy: Gửi email mỗi 2 phút');
  
  await this.mailService.sendCustomEmail(
    process.env.MAIL_USER,
    '⏰ Email Tự Động',
    'Email từ Cron Job!'
  );
}
```

### 2. Gửi Báo Cáo Hàng Ngày (9h Sáng)

```typescript
@Cron('0 9 * * *')
async sendDailyReport() {
  this.logger.log('📊 Gửi báo cáo hàng ngày');
  
  // Lấy dữ liệu từ database
  const stats = await this.getStatistics();
  
  await this.mailService.sendCustomEmail(
    'admin@example.com',
    '📊 Báo Cáo Hàng Ngày',
    `Tổng user: ${stats.totalUsers}`,
    this.generateReportHTML(stats)
  );
}
```

### 3. Xóa Dữ Liệu Cũ (12h Đêm Mỗi Ngày)

```typescript
@Cron('0 0 * * *')
async cleanupOldData() {
  this.logger.log('🗑️ Xóa dữ liệu cũ');
  
  // Xóa token hết hạn
  await this.deleteExpiredTokens();
  
  // Xóa file upload cũ
  await this.deleteOldFiles();
}
```

### 4. Nhắc Nhở User (Mỗi Giờ)

```typescript
@Cron('0 * * * *')
async sendReminders() {
  this.logger.log('🔔 Gửi email nhắc nhở');
  
  // Tìm user cần nhắc nhở
  const users = await this.findUsersNeedReminder();
  
  for (const user of users) {
    await this.mailService.sendCustomEmail(
      user.email,
      '🔔 Nhắc Nhở',
      `Xin chào ${user.name}, bạn có task cần hoàn thành!`
    );
  }
}
```

### 5. Backup Database (2h Sáng Mỗi Ngày)

```typescript
@Cron('0 2 * * *')
async backupDatabase() {
  this.logger.log('💾 Backup database');
  
  await this.performBackup();
  
  // Gửi email thông báo
  await this.mailService.sendCustomEmail(
    'admin@example.com',
    '💾 Backup Hoàn Tất',
    'Database đã được backup thành công!'
  );
}
```

---

## 🧪 Testing

### Test Cron Job Ngay Lập Tức

Thêm method test vào `tasks.service.ts`:

```typescript
// Method này có thể gọi từ controller để test
async testCronJob() {
  this.logger.log('🧪 Test cron job manually');
  await this.handleCronEvery2Minutes();
}
```

Thêm endpoint test vào `app.controller.ts`:

```typescript
@Get('test-cron')
async testCron() {
  await this.tasksService.testCronJob();
  return { message: 'Cron job đã chạy! Kiểm tra Mailtrap.' };
}
```

### Kiểm Tra Log

Khi cron job chạy, bạn sẽ thấy log trong console:

```
🕐 Cron job chạy: Gửi email mỗi 2 phút
✅ Email đã được gửi thành công!
```

### Kiểm Tra Email

Vào Mailtrap inbox để xem email đã được gửi.

---

## ⚙️ Cấu Hình Nâng Cao

### 1. Tắt Cron Job Trong Development

```typescript
@Cron('*/2 * * * *', {
  disabled: process.env.NODE_ENV === 'development',
})
```

### 2. Set Timezone

```typescript
@Cron('0 9 * * *', {
  timeZone: 'Asia/Ho_Chi_Minh',
})
```

### 3. Chạy Ngay Khi Start

```typescript
@Cron('*/2 * * * *', {
  runOnInit: true, // Chạy ngay khi app start
})
```

### 4. Đặt Tên Cho Cron Job

```typescript
@Cron('*/2 * * * *', {
  name: 'send-email-every-2-minutes',
})
```

---

## 🎯 Use Cases Thực Tế

### 1. E-commerce
- Gửi email giỏ hàng bỏ quên (mỗi giờ)
- Gửi khuyến mãi (9h sáng mỗi ngày)
- Cập nhật trạng thái đơn hàng (mỗi 5 phút)

### 2. Social Media
- Gửi thông báo tổng hợp (6h chiều mỗi ngày)
- Xóa nội dung vi phạm (mỗi giờ)
- Backup dữ liệu (2h sáng)

### 3. SaaS Application
- Gửi hóa đơn (ngày 1 mỗi tháng)
- Nhắc gia hạn (7 ngày trước hết hạn)
- Gửi báo cáo usage (cuối tuần)

---

## 🚨 Lưu Ý Quan Trọng

### 1. Performance
- Không chạy task nặng trong cron job
- Dùng queue (Bull) cho task phức tạp
- Giới hạn số lượng email gửi cùng lúc

### 2. Error Handling
```typescript
@Cron('*/2 * * * *')
async handleCron() {
  try {
    await this.doSomething();
  } catch (error) {
    this.logger.error('Cron job failed:', error);
    // Gửi email thông báo lỗi cho admin
  }
}
```

### 3. Logging
- Luôn log khi cron job chạy
- Log cả thành công và thất bại
- Dùng Logger của NestJS

### 4. Testing
- Test cron job trước khi deploy
- Dùng interval ngắn để test (30s)
- Đổi lại interval thật sau khi test xong

---

## 📊 Monitoring

### Thêm Metrics

```typescript
private emailsSent = 0;
private emailsFailed = 0;

@Cron('*/2 * * * *')
async handleCron() {
  try {
    await this.sendEmail();
    this.emailsSent++;
  } catch (error) {
    this.emailsFailed++;
  }
  
  this.logger.log(`📊 Stats: Sent=${this.emailsSent}, Failed=${this.emailsFailed}`);
}
```

---

## ✅ Checklist

- [ ] Đã cài `@nestjs/schedule`
- [ ] Đã thêm `ScheduleModule.forRoot()` vào AppModule
- [ ] Đã tạo TasksModule và TasksService
- [ ] Đã test cron job với interval ngắn (30s hoặc 2 phút)
- [ ] Email xuất hiện trong Mailtrap
- [ ] Thấy log trong console
- [ ] Đổi interval về giá trị thật cho production

---

## 🎓 Tài Liệu Tham Khảo

- NestJS Schedule: https://docs.nestjs.com/techniques/task-scheduling
- Cron Expression: https://crontab.guru/
- Node-cron: https://github.com/node-cron/node-cron

---

## 🎯 Kết Luận

Bạn đã có hệ thống Cron Job hoàn chỉnh:
- ✅ Tự động gửi email mỗi 2 phút
- ✅ Dễ dàng thêm cron job mới
- ✅ Logging đầy đủ
- ✅ Error handling an toàn

Để thêm cron job mới, chỉ cần thêm method với decorator `@Cron()` trong `tasks.service.ts`!
