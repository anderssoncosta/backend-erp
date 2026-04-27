import { Module } from '@nestjs/common';
import { FleetService } from './application/services/fleet.service';
import { FleetController } from './presentation/controllers/fleet.controller';

@Module({
  controllers: [FleetController],
  providers: [FleetService],
})
export class FleetModule {}
