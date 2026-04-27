import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    tenantId: string,
    body: {
      code: string;
      name: string;
      type: string;
      category?: string;
      brand?: string;
      model?: string;
      serialNumber?: string;
      installDate?: string;
      warrantyUntil?: string;
      branchId?: string;
      location?: string;
    },
  ) {
    return this.prisma.asset.create({
      data: {
        tenantId,
        code: body.code,
        name: body.name,
        type: body.type,
        category: body.category,
        brand: body.brand,
        model: body.model,
        serialNumber: body.serialNumber,
        installDate: body.installDate ? new Date(body.installDate) : undefined,
        warrantyUntil: body.warrantyUntil ? new Date(body.warrantyUntil) : undefined,
        branchId: body.branchId,
        location: body.location,
        status: 'ACTIVE',
      },
    });
  }

  list(
    tenantId: string,
    status?: string,
    category?: string,
    branchId?: string,
    search?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    return this.prisma.asset.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(status && { status }),
        ...(category && { category }),
        ...(branchId && { branchId }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
            { serialNumber: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  findOne(id: string, tenantId: string) {
    return this.prisma.asset.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { history: { orderBy: { performedAt: 'desc' }, take: 10 } },
    });
  }

  update(
    id: string,
    tenantId: string,
    body: {
      status?: string;
      location?: string;
      branchId?: string;
      warrantyUntil?: string;
      notes?: string;
    },
  ) {
    return this.prisma.asset.updateMany({
      where: { id, tenantId },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.branchId !== undefined && { branchId: body.branchId }),
        ...(body.warrantyUntil && { warrantyUntil: new Date(body.warrantyUntil) }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });
  }

  addHistory(
    assetId: string,
    tenantId: string,
    body: {
      type: string;
      description: string;
      performedAt?: string;
      performedById?: string;
      cost?: number;
    },
  ) {
    return this.prisma.assetHistory.create({
      data: {
        tenantId,
        assetId,
        type: body.type,
        description: body.description,
        performedAt: body.performedAt ? new Date(body.performedAt) : new Date(),
        performedById: body.performedById,
        cost: body.cost,
      },
    });
  }
}
