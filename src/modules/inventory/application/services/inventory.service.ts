import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  getStock(tenantId: string, branchId?: string) {
    return this.prisma.stockItem.findMany({
      where: { tenantId, ...(branchId && { branchId }), isActive: true },
      include: { material: { select: { id: true, code: true, name: true, unit: true, minStock: true } } },
    });
  }

  getMovements(tenantId: string, materialId?: string, branchId?: string, type?: string, page: number = 1, limit: number = 20) {
    return this.prisma.stockMovement.findMany({
      where: { tenantId, ...(materialId && { materialId }), ...(branchId && { branchId }), ...(type && { type }) },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  getTransfers(tenantId: string, page: number = 1, limit: number = 20) {
    return this.prisma.stockTransfer.findMany({
      where: { tenantId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  getMaterials(tenantId: string, search?: string, page: number = 1, limit: number = 20) {
    return this.prisma.material.findMany({
      where: {
        tenantId, deletedAt: null, isActive: true,
        ...(search && { OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ]}),
      },
      include: { group: true },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  createMaterial(
    tenantId: string,
    data: {
      code: string; name: string; description?: string; unit?: string;
      groupId?: string; minStock?: number; maxStock?: number; costPrice?: number;
    },
  ) {
    return this.prisma.material.create({ data: { ...data, tenantId, isActive: true } });
  }

  getMaterial(id: string, tenantId: string) {
    return this.prisma.material.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { group: true },
    });
  }
}
