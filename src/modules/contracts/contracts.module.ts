import { Module } from '@nestjs/common';
import { CreateContractUseCase } from './application/use-cases/create-contract/create-contract.use-case';
import { ContractsController } from './presentation/controllers/contracts.controller';

@Module({
  controllers: [ContractsController],
  providers: [CreateContractUseCase],
  exports: [CreateContractUseCase],
})
export class ContractsModule {}
