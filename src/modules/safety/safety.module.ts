import { Module } from '@nestjs/common';
import { SafetyService } from './application/services/safety.service';
import { SafetyController } from './presentation/controllers/safety.controller';

@Module({
  controllers: [SafetyController],
  providers: [SafetyService],
})
export class SafetyModule {}
