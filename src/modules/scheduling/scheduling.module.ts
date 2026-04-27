import { Module } from '@nestjs/common';
import { SchedulingController } from './presentation/controllers/scheduling.controller';
import { CreateScheduleUseCase } from './application/use-cases/create-schedule/create-schedule.use-case';
import { SchedulingService } from './application/services/scheduling.service';

@Module({
  controllers: [SchedulingController],
  providers: [CreateScheduleUseCase, SchedulingService],
})
export class SchedulingModule {}
