import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@ApiTags('Vehicle Tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'vehicle-tracking', version: '1' })
export class VehicleTrackingController {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.vehiclePosition.create({
      data: {
        tenantId,
        vehicleId: body.vehicleId,
        latitude: body.latitude,
        longitude: body.longitude,
        speed: body.speed,
        heading: body.heading,
        accuracy: body.accuracy,
        source: body.source ?? 'GPS',
        timestamp: new Date(),
      },
    });
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
    const dateFilter = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };
    const timestamp = Object.keys(dateFilter).length ? dateFilter : undefined;

    return this.prisma.vehiclePosition.findMany({
      where: {
        tenantId,
        vehicleId,
        ...(timestamp && { timestamp }),
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  @Get('vehicles/:vehicleId/last-position')
  @ApiOperation({ summary: 'Get last vehicle position' })
  @Permissions('vehicle-tracking', 'read')
  getLastPosition(@Param('vehicleId', ParseUUIDPipe) vehicleId: string, @CurrentTenant() tenantId: string) {
    return this.prisma.vehiclePosition.findFirst({
      where: { tenantId, vehicleId },
      orderBy: { timestamp: 'desc' },
    });
  }

  @Get('fleet-map')
  @ApiOperation({ summary: 'Get current positions for all fleet vehicles' })
  @Permissions('vehicle-tracking', 'read')
  async fleetMap(@CurrentTenant() tenantId: string) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, plate: true, model: true, status: true },
    });

    const positions = await Promise.all(
      vehicles.map((v) =>
        this.prisma.vehiclePosition.findFirst({
          where: { tenantId, vehicleId: v.id },
          orderBy: { timestamp: 'desc' },
        }),
      ),
    );

    return vehicles.map((v, i) => ({ ...v, lastPosition: positions[i] }));
  }
}
