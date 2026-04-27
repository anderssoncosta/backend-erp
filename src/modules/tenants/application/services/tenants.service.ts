import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number, limit: number) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const [total, data] = await Promise.all([
      this.prisma.tenant.count({ where: { deletedAt: null } }),
      this.prisma.tenant.findMany({
        where: { deletedAt: null },
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          cnpj: true,
          email: true,
          phone: true,
          plan: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
        hasNextPage: safePage * safeLimit < total,
        hasPreviousPage: safePage > 1,
      },
    };
  }

  findMine(tenantId: string) {
    return this.prisma.tenant.findFirst({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        cnpj: true,
        email: true,
        phone: true,
        plan: true,
        status: true,
        logoUrl: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.tenant.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, name: true, slug: true, plan: true, status: true, createdAt: true },
    });
  }

  create(data: {
    name: string;
    slug: string;
    cnpj?: string;
    email?: string;
    phone?: string;
    plan?: string;
    status?: string;
    logoUrl?: string;
    settings?: object;
  }) {
    return this.prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        cnpj: data.cnpj ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        plan: data.plan ?? 'STARTER',
        status: data.status ?? 'ACTIVE',
        logoUrl: data.logoUrl ?? null,
        settings: data.settings ?? {},
      },
    });
  }

  update(id: string, data: { name?: string; email?: string; phone?: string; settings?: object }) {
    return this.prisma.tenant.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.tenant.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
    return { message: 'Tenant deleted' };
  }
}
