import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  providers: [TasksService],
})
export class TasksModule {}
