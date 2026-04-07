import { Module } from '@nestjs/common';
import { WorksController } from './presentation/controllers/works.controller';

@Module({
  controllers: [WorksController],
  providers: [],
})
export class WorksModule {}
