import { Module } from '@nestjs/common';
import { CallCenterService } from './application/services/call-center.service';
import { CallCenterController } from './presentation/controllers/call-center.controller';

@Module({
  controllers: [CallCenterController],
  providers: [CallCenterService],
})
export class CallCenterModule {}
