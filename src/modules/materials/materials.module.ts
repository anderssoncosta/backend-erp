import { Module } from '@nestjs/common';
import { MaterialsController } from './presentation/controllers/materials.controller';
import { CreateMaterialUseCase } from './application/use-cases/create-material/create-material.use-case';

@Module({
  controllers: [MaterialsController],
  providers: [CreateMaterialUseCase],
})
export class MaterialsModule {}
