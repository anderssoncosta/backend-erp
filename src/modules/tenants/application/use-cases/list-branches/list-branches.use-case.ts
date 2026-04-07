import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { Pagination } from '@shared/domain/value-objects/pagination.vo';

@Injectable()
export class ListBranchesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(tenantId: string, page = 1, limit = 20) {
    const pagination = new Pagination({ page, limit });
    const [total, data] = await Promise.all([
      this.prisma.branch.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.branch.findMany({
        where: { tenantId, deletedAt: null },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { name: 'asc' },
      }),
    ]);
    return { data, meta: Pagination.buildMeta(total, pagination.page, pagination.limit) };
  }
}
