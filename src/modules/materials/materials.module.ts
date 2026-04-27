import { Module } from '@nestjs/common';
import { MaterialsController } from './presentation/controllers/materials.controller';
import { CreateMaterialUseCase } from './application/use-cases/create-material/create-material.use-case';
import { MaterialsService } from './application/services/materials.service';

@Module({
  controllers: [MaterialsController],
  providers: [CreateMaterialUseCase, MaterialsService],
})
export class MaterialsModule {}
