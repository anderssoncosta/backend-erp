import { Module } from '@nestjs/common';
import { WorksService } from './application/services/works.service';
import { WorksController } from './presentation/controllers/works.controller';

@Module({
  controllers: [WorksController],
  providers: [WorksService],
})
export class WorksModule {}
