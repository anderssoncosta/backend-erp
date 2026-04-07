import { Module } from '@nestjs/common';
import { CallCenterController } from './presentation/controllers/call-center.controller';

@Module({
  controllers: [CallCenterController],
  providers: [],
})
export class CallCenterModule {}
