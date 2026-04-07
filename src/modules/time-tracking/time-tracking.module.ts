import { Module } from '@nestjs/common';
import { TimeTrackingController } from './presentation/controllers/time-tracking.controller';

@Module({
  controllers: [TimeTrackingController],
  providers: [],
})
export class TimeTrackingModule {}
