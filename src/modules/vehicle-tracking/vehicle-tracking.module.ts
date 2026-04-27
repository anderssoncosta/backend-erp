import { Module } from '@nestjs/common';
import { VehicleTrackingService } from './application/services/vehicle-tracking.service';
import { VehicleTrackingController } from './presentation/controllers/vehicle-tracking.controller';

@Module({
  controllers: [VehicleTrackingController],
  providers: [VehicleTrackingService],
})
export class VehicleTrackingModule {}
