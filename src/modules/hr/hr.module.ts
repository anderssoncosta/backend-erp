import { Module } from '@nestjs/common';
import { HrController } from './presentation/controllers/hr.controller';

@Module({
  controllers: [HrController],
  providers: [],
})
export class HrModule {}
