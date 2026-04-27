import { Module } from '@nestjs/common';
import { CreateBranchUseCase } from './application/use-cases/create-branch/create-branch.use-case';
import { ListBranchesUseCase } from './application/use-cases/list-branches/list-branches.use-case';
import { TenantsService } from './application/services/tenants.service';
import { BranchesService } from './application/services/branches.service';
import { TenantsController } from './presentation/controllers/tenants.controller';
import { BranchesController } from './presentation/controllers/branches.controller';

@Module({
  controllers: [TenantsController, BranchesController],
  providers: [CreateBranchUseCase, ListBranchesUseCase, TenantsService, BranchesService],
  exports: [],
})
export class TenantsModule {}
