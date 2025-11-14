import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        const mailUser = configService.get<string>('MAIL_USER');
        const mailPassword = configService.get<string>('MAIL_PASSWORD');
        
        console.log('🔍 Email Config:');
        console.log('  MAIL_HOST:', configService.get<string>('MAIL_HOST'));
        console.log('  MAIL_USER:', mailUser);
        
        return {
          transport: {
            host: configService.get<string>('MAIL_HOST') || 'sandbox.smtp.mailtrap.io',
            port: parseInt(configService.get<string>('MAIL_PORT')) || 2525,
            secure: false,
            auth: {
              user: mailUser,
              pass: mailPassword,
            },
          },
          defaults: {
            from: `"${configService.get<string>('MAIL_FROM_NAME') || 'NestJS App'}" <${configService.get<string>('MAIL_FROM') || 'noreply@example.com'}>`,
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
