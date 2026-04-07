import { Module } from '@nestjs/common';
import { AssetsController } from './presentation/controllers/assets.controller';

@Module({
  controllers: [AssetsController],
  providers: [],
})
export class AssetsModule {}
