import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { VehicleTrackingService } from '../../application/services/vehicle-tracking.service';

@ApiTags('Vehicle Tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'vehicle-tracking', version: '1' })
export class VehicleTrackingController {
  constructor(private readonly vehicleTrackingService: VehicleTrackingService) {}

  @Post('positions')
  @ApiOperation({ summary: 'Record vehicle position' })
  @Permissions('vehicle-tracking', 'create')
  recordPosition(
    @Body() body: {
      vehicleId: string; latitude: number; longitude: number;
      speed?: number; heading?: number; accuracy?: number; source?: string;
    },
    @CurrentTenant() tenantId: string,
  ) {
    return this.vehicleTrackingService.recordPosition(tenantId, body);
  }

  @Get('vehicles/:vehicleId/positions')
  @ApiOperation({ summary: 'Get vehicle positions history' })
  @Permissions('vehicle-tracking', 'read')
  getPositions(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @CurrentTenant() tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit = 100,
  ) {
    return this.vehicleTrackingService.getPositions(vehicleId, tenantId, from, to, limit);
  }

  @Get('vehicles/:vehicleId/last-position')
  @ApiOperation({ summary: 'Get last vehicle position' })
  @Permissions('vehicle-tracking', 'read')
  getLastPosition(@Param('vehicleId', ParseUUIDPipe) vehicleId: string, @CurrentTenant() tenantId: string) {
    return this.vehicleTrackingService.getLastPosition(vehicleId, tenantId);
  }

  @Get('fleet-map')
  @ApiOperation({ summary: 'Get current positions for all fleet vehicles' })
  @Permissions('vehicle-tracking', 'read')
  fleetMap(@CurrentTenant() tenantId: string) {
    return this.vehicleTrackingService.fleetMap(tenantId);
  }
}
