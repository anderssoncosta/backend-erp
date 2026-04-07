import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { Pagination } from '@shared/domain/value-objects/pagination.vo';
import { ListUsersQueryDto } from './list-users.query.dto';

const USER_SELECT = {
  id: true, tenantId: true, branchId: true, name: true, email: true,
  phone: true, role: true, status: true, avatarUrl: true, lastLoginAt: true, createdAt: true,
};

@Injectable()
export class ListUsersUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListUsersQueryDto, tenantId: string) {
    const pagination = new Pagination({ page: query.page, limit: query.limit });

    const where: Record<string, unknown> = { tenantId, deletedAt: null };
    if (query.role) where['role'] = query.role;
    if (query.status) where['status'] = query.status;
    if (query.branchId) where['branchId'] = query.branchId;
    if (query.search) {
      where['OR'] = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where, skip: pagination.skip, take: pagination.limit,
        select: USER_SELECT, orderBy: { name: 'asc' },
      }),
    ]);

    return { data, meta: Pagination.buildMeta(total, pagination.page, pagination.limit) };
  }
}
