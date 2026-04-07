import { Module } from '@nestjs/common';
import { FleetController } from './presentation/controllers/fleet.controller';

@Module({
  controllers: [FleetController],
  providers: [],
})
export class FleetModule {}
