import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { CreateGroupDto } from '../use-cases/create-group/create-group.dto';

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  createGroup(tenantId: string, dto: CreateGroupDto) {
    return this.prisma.materialGroup.create({ data: { ...dto, tenantId } });
  }

  listGroups(tenantId: string) {
    return this.prisma.materialGroup.findMany({
      where: { tenantId },
      include: { _count: { select: { materials: true } } },
      orderBy: { name: 'asc' },
    });
  }

  list(tenantId: string, search?: string, groupId?: string, isActive?: string, page: number = 1, limit: number = 20) {
    return this.prisma.material.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(isActive !== undefined ? { isActive: isActive === 'true' } : {}),
        ...(groupId && { groupId }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: { group: true },
      orderBy: { name: 'asc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });
  }

  findOne(id: string, tenantId: string) {
    return this.prisma.material.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { group: true, stockItems: { select: { id: true, branchId: true, quantity: true, availableQty: true, location: true } } },
    });
  }
}
