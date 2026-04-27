import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@Injectable()
export class PublicLightingService {
  constructor(private readonly prisma: PrismaService) {}

  createPoint(
    tenantId: string,
    body: { code: string; address: string; city: string; neighborhood?: string; state?: string; latitude?: number; longitude?: number; type?: string; lampType?: string; power?: number; branchId?: string },
  ) {
    return this.prisma.lightingPoint.create({
      data: {
        tenantId,
        code: body.code,
        address: body.address,
        city: body.city,
        neighborhood: body.neighborhood,
        state: body.state ?? 'SP',
        latitude: body.latitude,
        longitude: body.longitude,
        type: body.type ?? 'POLE',
        lampType: body.lampType,
        power: body.power,
        branchId: body.branchId,
        status: 'ACTIVE',
      },
    });
  }

  listPoints(tenantId: string, status?: string, lampType?: string, search?: string, page: number = 1, limit: number = 50) {
    return this.prisma.lightingPoint.findMany({
      where: {
        tenantId,
        ...(status && { status }),
        ...(lampType && { lampType }),
        ...(search && {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { code: 'asc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });
  }

  updatePointStatus(id: string, tenantId: string, status: string) {
    return this.prisma.lightingPoint.updateMany({ where: { id, tenantId }, data: { status } });
  }

  createOrder(
    tenantId: string,
    body: { lightingPointId: string; type: string; description: string; priority?: string; scheduledAt?: string; technicianId?: string },
  ) {
    return this.prisma.lightingOrder.create({
      data: {
        tenantId,
        lightingPointId: body.lightingPointId,
        type: body.type,
        description: body.description,
        priority: body.priority ?? 'MEDIUM',
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        technicianId: body.technicianId,
        status: 'PENDING',
      },
    });
  }

  listOrders(tenantId: string, status?: string, type?: string, technicianId?: string, page: number = 1, limit: number = 20) {
    return this.prisma.lightingOrder.findMany({
      where: { tenantId, ...(status && { status }), ...(type && { type }), ...(technicianId && { technicianId }) },
      include: { lightingPoint: { select: { id: true, code: true, address: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });
  }

  completeOrder(id: string, tenantId: string, notes?: string, completedAt?: string) {
    return this.prisma.lightingOrder.updateMany({
      where: { id, tenantId },
      data: { status: 'COMPLETED', completedAt: completedAt ? new Date(completedAt) : new Date(), notes },
    });
  }
}
