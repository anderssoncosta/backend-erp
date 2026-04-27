import { Module } from '@nestjs/common';
import { CreateContractUseCase } from './application/use-cases/create-contract/create-contract.use-case';
import { ContractsService } from './application/services/contracts.service';
import { ContractsController } from './presentation/controllers/contracts.controller';

@Module({
  controllers: [ContractsController],
  providers: [CreateContractUseCase, ContractsService],
  exports: [CreateContractUseCase],
})
export class ContractsModule {}
