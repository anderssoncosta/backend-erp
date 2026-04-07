import { Module } from '@nestjs/common';
import { VehicleTrackingController } from './presentation/controllers/vehicle-tracking.controller';

@Module({
  controllers: [VehicleTrackingController],
  providers: [],
})
export class VehicleTrackingModule {}
