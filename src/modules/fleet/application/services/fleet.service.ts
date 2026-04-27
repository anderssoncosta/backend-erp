import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@Injectable()
export class FleetService {
  constructor(private readonly prisma: PrismaService) {}

  createVehicle(
    tenantId: string,
    body: {
      plate: string; model: string; brand: string; year?: number; type: string;
      color?: string; renavam?: string; chassis?: string; fuelType?: string;
      branchId?: string; assignedToId?: string;
    },
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

  listVehicles(tenantId: string, status?: string, branchId?: string, page: number = 1, limit: number = 20) {
    return this.prisma.vehicle.findMany({
      where: { tenantId, isActive: true, ...(status && { status }), ...(branchId && { branchId }) },
      orderBy: { plate: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  getVehicle(id: string, tenantId: string) {
    return this.prisma.vehicle.findFirst({
      where: { id, tenantId },
      include: { maintenances: { orderBy: { performedAt: 'desc' }, take: 5 } },
    });
  }

  updateStatus(id: string, tenantId: string, status: string, assignedToId?: string | null) {
    return this.prisma.vehicle.updateMany({
      where: { id, tenantId },
      data: { status, ...(assignedToId !== undefined && { assignedToId }) },
    });
  }

  registerMaintenance(
    vehicleId: string,
    tenantId: string,
    body: {
      type: string; description: string; performedAt?: string;
      cost?: number; mileage?: number; nextAt?: string;
      performedById?: string; workshopName?: string; notes?: string;
    },
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

  listMaintenance(tenantId: string, vehicleId?: string, page: number = 1, limit: number = 20) {
    return this.prisma.vehicleMaintenance.findMany({
      where: { tenantId, ...(vehicleId && { vehicleId }) },
      include: { vehicle: { select: { id: true, plate: true, model: true } } },
      orderBy: { performedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
