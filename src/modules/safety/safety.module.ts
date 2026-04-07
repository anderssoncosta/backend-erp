import { Module } from '@nestjs/common';
import { SafetyController } from './presentation/controllers/safety.controller';

@Module({
  controllers: [SafetyController],
  providers: [],
})
export class SafetyModule {}
