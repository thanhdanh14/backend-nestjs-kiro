import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailService } from '../mail/mail.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly mailService: MailService) {}

  // Chạy mỗi 2 phút
  // @Cron('*/2 * * * *')
  async handleCronEvery2Minutes() {
    this.logger.log('🕐 Cron job chạy: Gửi email mỗi 2 phút');
    
    try {
      const testEmail = 'admin@example.com'; // Email người nhận
      const currentTime = new Date().toLocaleString('vi-VN');
      
      await this.mailService.sendCustomEmail(
        testEmail,
        '⏰ Email Tự Động - Cron Job',
        `Đây là email tự động được gửi mỗi 2 phút từ Cron Job! Thời gian: ${currentTime}`,
        `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
            <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #4CAF50; margin-top: 0;">⏰ Email Tự Động</h2>
              <p style="font-size: 16px; line-height: 1.6;">Đây là email được gửi tự động bởi Cron Job!</p>
              <div style="background: #e8f5e9; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0;"><strong>⏰ Thời gian:</strong> ${currentTime}</p>
                <p style="margin: 10px 0 0 0;"><strong>📧 Gửi đến:</strong> ${testEmail}</p>
              </div>
              <p style="color: #4CAF50; font-weight: bold;">Cron job đang hoạt động hoàn hảo! 🎉</p>
            </div>
          </div>
        `
      );
      
      this.logger.log(`✅ Email đã được gửi thành công đến ${testEmail}!`);
    } catch (error) {
      this.logger.error('❌ Lỗi khi gửi email:', error.message);
      this.logger.error('Chi tiết lỗi:', error.stack);
    }
  }

  // Chạy mỗi 5 phút (ví dụ thêm)
  // @Cron('*/5 * * * *')
  handleCronEvery5Minutes() {
    this.logger.log('🕐 Cron job chạy: Mỗi 5 phút');
  }

  // Chạy vào 9h sáng mỗi ngày
  // @Cron('0 9 * * *')
  handleCronDailyAt9AM() {
    this.logger.log('🕐 Cron job chạy: 9h sáng hàng ngày');
  }

  // Chạy mỗi 30 giây (để test nhanh) - TẮT ĐI VÌ CHẠY QUÁ NHIỀU
  // @Cron('*/30 * * * * *')
  // handleCronEvery30Seconds() {
  //   this.logger.log('🕐 Cron job chạy: Mỗi 30 giây');
  // }
}
