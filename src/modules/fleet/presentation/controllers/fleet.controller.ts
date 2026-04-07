import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@ApiTags('Fleet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'fleet', version: '1' })
export class FleetController {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.vehicle.create({
      data: {
        tenantId,
        plate: body.plate,
        model: body.model,
        brand: body.brand,
        year: body.year,
        type: body.type,
        color: body.color,
        renavam: body.renavam,
        chassis: body.chassis,
        fuelType: body.fuelType,
        branchId: body.branchId,
        assignedToId: body.assignedToId,
        status: 'AVAILABLE',
        isActive: true,
      },
    });
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
    return this.prisma.vehicle.findMany({
      where: {
        tenantId,
        isActive: true,
        ...(status && { status }),
        ...(branchId && { branchId }),
      },
      orderBy: { plate: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  @Get('vehicles/:id')
  @ApiOperation({ summary: 'Get vehicle by ID' })
  @Permissions('fleet', 'read')
  getVehicle(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.prisma.vehicle.findFirst({
      where: { id, tenantId },
      include: { maintenances: { orderBy: { performedAt: 'desc' }, take: 5 } },
    });
  }

  @Patch('vehicles/:id/status')
  @ApiOperation({ summary: 'Update vehicle status' })
  @Permissions('fleet', 'update')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string; assignedToId?: string | null },
    @CurrentTenant() tenantId: string,
  ) {
    return this.prisma.vehicle.updateMany({
      where: { id, tenantId },
      data: {
        status: body.status,
        ...(body.assignedToId !== undefined && { assignedToId: body.assignedToId }),
      },
    });
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
    return this.prisma.vehicleMaintenance.create({
      data: {
        tenantId,
        vehicleId,
        type: body.type,
        description: body.description,
        performedAt: body.performedAt ? new Date(body.performedAt) : new Date(),
        cost: body.cost,
        mileage: body.mileage,
        nextAt: body.nextAt ? new Date(body.nextAt) : undefined,
        performedById: body.performedById,
        workshopName: body.workshopName,
        notes: body.notes,
      },
    });
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
    return this.prisma.vehicleMaintenance.findMany({
      where: {
        tenantId,
        ...(vehicleId && { vehicleId }),
      },
      include: { vehicle: { select: { id: true, plate: true, model: true } } },
      orderBy: { performedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
