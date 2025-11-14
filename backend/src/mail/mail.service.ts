import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendWelcomeEmail(email: string, name: string) {
    console.log('📧 Sending welcome email to:', email);
    
    await this.mailerService.sendMail({
      to: email,
      subject: 'Chào mừng bạn đến với ứng dụng!',
      template: './welcome',
      context: {
        name: name,
        year: new Date().getFullYear(),
      },
    });
    
    console.log('✅ Welcome email sent successfully!');
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    await this.mailerService.sendMail({
      to: email,
      subject: 'Yêu cầu đặt lại mật khẩu',
      template: './reset-password',
      context: {
        resetUrl: resetUrl,
        year: new Date().getFullYear(),
      },
    });
  }



  async sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    
    await this.mailerService.sendMail({
      to: email,
      subject: 'Xác thực email của bạn',
      template: './verify-email',
      context: {
        verifyUrl: verifyUrl,
        year: new Date().getFullYear(),
      },
    });
  }

  async sendCustomEmail(to: string, subject: string, text: string, html?: string) {
    console.log('📧 Sending custom email to:', to);
    console.log('📧 Subject:', subject);
    
    await this.mailerService.sendMail({
      to: to,
      subject: subject,
      text: text,
      html: html,
    });
    
    console.log('✅ Custom email sent successfully!');
  }

  async sendOtpEmail(email: string, name: string, otpCode: string) {
    console.log('📧 Sending OTP email to:', email);
    console.log('🔐 OTP Code:', otpCode);
    
    await this.mailerService.sendMail({
      to: email,
      subject: '🔐 Mã OTP đăng nhập của bạn',
      template: './otp',
      context: {
        name: name,
        otpCode: otpCode,
        year: new Date().getFullYear(),
      },
    });
    
    console.log('✅ OTP email sent successfully!');
  }

  async sendPasswordChangedEmail(email: string, name: string, ipAddress?: string) {
    console.log('📧 Sending password changed email to:', email);
    
    const changeTime = new Date().toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh',
    });

    await this.mailerService.sendMail({
      to: email,
      subject: '✅ Mật khẩu của bạn đã được thay đổi',
      template: './password-changed',
      context: {
        name: name,
        email: email,
        changeTime: changeTime,
        ipAddress: ipAddress || 'Không xác định',
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login`,
        year: new Date().getFullYear(),
      },
    });
    
    console.log('✅ Password changed email sent successfully!');
  }
}
