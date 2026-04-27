import { Module } from '@nestjs/common';
import { FieldExecutionController } from './presentation/controllers/field-execution.controller';
import { CheckInUseCase } from './application/use-cases/check-in/check-in.use-case';
import { CheckOutUseCase } from './application/use-cases/check-out/check-out.use-case';
import { FieldExecutionService } from './application/services/field-execution.service';

@Module({
  controllers: [FieldExecutionController],
  providers: [CheckInUseCase, CheckOutUseCase, FieldExecutionService],
})
export class FieldExecutionModule {}
