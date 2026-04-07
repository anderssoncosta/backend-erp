import { Module } from '@nestjs/common';
import { ReportsController } from './presentation/controllers/reports.controller';

@Module({
  controllers: [ReportsController],
  providers: [],
})
export class ReportsModule {}
