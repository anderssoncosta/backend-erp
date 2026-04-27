import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@Injectable()
export class VehicleTrackingService {
  constructor(private readonly prisma: PrismaService) {}

  recordPosition(
    tenantId: string,
    body: { vehicleId: string; latitude: number; longitude: number; speed?: number; heading?: number; accuracy?: number; source?: string },
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

  getPositions(vehicleId: string, tenantId: string, from?: string, to?: string, limit: number = 100) {
    const dateFilter = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };
    const timestamp = Object.keys(dateFilter).length ? dateFilter : undefined;

    return this.prisma.vehiclePosition.findMany({
      where: { tenantId, vehicleId, ...(timestamp && { timestamp }) },
      orderBy: { timestamp: 'desc' },
      take: Number(limit),
    });
  }

  getLastPosition(vehicleId: string, tenantId: string) {
    return this.prisma.vehiclePosition.findFirst({
      where: { tenantId, vehicleId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async fleetMap(tenantId: string) {
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
