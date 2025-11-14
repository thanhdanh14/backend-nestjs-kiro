import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MailService } from './mail/mail.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly mailService: MailService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-email')
  async testEmail() {
    try {
      console.log('🔍 Testing email configuration...');
      console.log('🔍 MAIL_USER:', process.env.MAIL_USER);
      console.log('🔍 MAIL_HOST:', process.env.MAIL_HOST);
      
      await this.mailService.sendWelcomeEmail(
        process.env.MAIL_USER || 'test@example.com',
        'Test User'
      );
      
      return { 
        success: true, 
        message: 'Email đã được gửi! Kiểm tra hộp thư của bạn.',
        sentTo: process.env.MAIL_USER,
      };
    } catch (error) {
      console.error('❌ Email error:', error);
      return { 
        success: false, 
        message: 'Lỗi: ' + error.message,
        details: error.toString(),
      };
    }
  }

  @Get('debug-env')
  debugEnv() {
    return {
      MAIL_HOST: process.env.MAIL_HOST,
      MAIL_PORT: process.env.MAIL_PORT,
      MAIL_USER: process.env.MAIL_USER,
      MAIL_PASSWORD: process.env.MAIL_PASSWORD 
        ? '***' + process.env.MAIL_PASSWORD.slice(-4) 
        : 'MISSING',
      MAIL_FROM: process.env.MAIL_FROM,
      NODE_ENV: process.env.NODE_ENV,
    };
  }
}
