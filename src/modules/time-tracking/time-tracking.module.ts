import { Module } from '@nestjs/common';
import { TimeTrackingService } from './application/services/time-tracking.service';
import { TimeTrackingController } from './presentation/controllers/time-tracking.controller';

@Module({
  controllers: [TimeTrackingController],
  providers: [TimeTrackingService],
})
export class TimeTrackingModule {}
