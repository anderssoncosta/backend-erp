import { Module } from '@nestjs/common';
import { HrService } from './application/services/hr.service';
import { HrController } from './presentation/controllers/hr.controller';

@Module({
  controllers: [HrController],
  providers: [HrService],
})
export class HrModule {}
