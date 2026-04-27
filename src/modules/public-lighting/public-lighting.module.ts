import { Module } from '@nestjs/common';
import { PublicLightingService } from './application/services/public-lighting.service';
import { PublicLightingController } from './presentation/controllers/public-lighting.controller';

@Module({
  controllers: [PublicLightingController],
  providers: [PublicLightingService],
})
export class PublicLightingModule {}
