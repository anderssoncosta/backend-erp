import { Global, Module } from '@nestjs/common';
import { NotificationService } from './application/services/notification.service';
import { NotificationsController } from './presentation/controllers/notifications.controller';

@Global()
@Module({
  controllers: [NotificationsController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationsModule {}
