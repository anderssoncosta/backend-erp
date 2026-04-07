import { Module } from '@nestjs/common';
import { PublicLightingController } from './presentation/controllers/public-lighting.controller';

@Module({
  controllers: [PublicLightingController],
  providers: [],
})
export class PublicLightingModule {}
