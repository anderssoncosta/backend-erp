import { Module } from '@nestjs/common';
import { SchedulingController } from './presentation/controllers/scheduling.controller';
import { CreateScheduleUseCase } from './application/use-cases/create-schedule/create-schedule.use-case';

@Module({
  controllers: [SchedulingController],
  providers: [CreateScheduleUseCase],
})
export class SchedulingModule {}
