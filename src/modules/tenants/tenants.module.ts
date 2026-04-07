import { Module } from '@nestjs/common';
import { CreateBranchUseCase } from './application/use-cases/create-branch/create-branch.use-case';
import { ListBranchesUseCase } from './application/use-cases/list-branches/list-branches.use-case';
import { TenantsController } from './presentation/controllers/tenants.controller';
import { BranchesController } from './presentation/controllers/branches.controller';

@Module({
  controllers: [TenantsController, BranchesController],
  providers: [CreateBranchUseCase, ListBranchesUseCase],
  exports: [],
})
export class TenantsModule {}
