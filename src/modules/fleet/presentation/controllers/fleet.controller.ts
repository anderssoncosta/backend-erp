import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { FleetService } from '../../application/services/fleet.service';

@ApiTags('Fleet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'fleet', version: '1' })
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  // ─── Vehicles ──────────────────────────────────────────────────────────────

  @Post('vehicles')
  @ApiOperation({ summary: 'Register vehicle' })
  @Permissions('fleet', 'create')
  createVehicle(
    @Body() body: {
      plate: string; model: string; brand: string; year?: number; type: string;
      color?: string; renavam?: string; chassis?: string; fuelType?: string;
      branchId?: string; assignedToId?: string;
    },
    @CurrentTenant() tenantId: string,
  ) {
    return this.fleetService.createVehicle(tenantId, body);
  }

  @Get('vehicles')
  @ApiOperation({ summary: 'List vehicles' })
  @Permissions('fleet', 'read')
  listVehicles(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
    @Query('branchId') branchId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.fleetService.listVehicles(tenantId, status, branchId, page, limit);
  }

  @Get('vehicles/:id')
  @ApiOperation({ summary: 'Get vehicle by ID' })
  @Permissions('fleet', 'read')
  getVehicle(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.fleetService.getVehicle(id, tenantId);
  }

  @Patch('vehicles/:id/status')
  @ApiOperation({ summary: 'Update vehicle status' })
  @Permissions('fleet', 'update')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string; assignedToId?: string | null },
    @CurrentTenant() tenantId: string,
  ) {
    return this.fleetService.updateStatus(id, tenantId, body.status, body.assignedToId);
  }

  // ─── Maintenance ───────────────────────────────────────────────────────────

  @Post('vehicles/:id/maintenance')
  @ApiOperation({ summary: 'Register vehicle maintenance' })
  @Permissions('fleet', 'create')
  registerMaintenance(
    @Param('id', ParseUUIDPipe) vehicleId: string,
    @Body() body: {
      type: string; description: string; performedAt?: string;
      cost?: number; mileage?: number; nextAt?: string;
      performedById?: string; workshopName?: string; notes?: string;
    },
    @CurrentTenant() tenantId: string,
  ) {
    return this.fleetService.registerMaintenance(vehicleId, tenantId, body);
  }

  @Get('maintenance')
  @ApiOperation({ summary: 'List maintenance records' })
  @Permissions('fleet', 'read')
  listMaintenance(
    @CurrentTenant() tenantId: string,
    @Query('vehicleId') vehicleId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.fleetService.listMaintenance(tenantId, vehicleId, page, limit);
  }
}
