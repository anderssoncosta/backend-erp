import { Module } from '@nestjs/common';
import { FieldExecutionController } from './presentation/controllers/field-execution.controller';
import { CheckInUseCase } from './application/use-cases/check-in/check-in.use-case';
import { CheckOutUseCase } from './application/use-cases/check-out/check-out.use-case';

@Module({
  controllers: [FieldExecutionController],
  providers: [CheckInUseCase, CheckOutUseCase],
})
export class FieldExecutionModule {}
