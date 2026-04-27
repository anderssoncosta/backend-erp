import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

export interface AuditParams {
  tenantId: string;
  userId?: string;
  module: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  severity?: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  list(
    tenantId: string,
    module?: string,
    action?: string,
    entityType?: string,
    entityId?: string,
    userId?: string,
    severity?: string,
    from?: string,
    to?: string,
    page: number = 1,
    limit: number = 50,
  ) {
    const dateFilter = { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) };
    const createdAt = Object.keys(dateFilter).length ? dateFilter : undefined;

    return this.prisma.auditLog.findMany({
      where: {
        tenantId,
        ...(module && { module }),
        ...(action && { action }),
        ...(entityType && { entityType }),
        ...(entityId && { entityId }),
        ...(userId && { userId }),
        ...(severity && { severity }),
        ...(createdAt && { createdAt }),
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });
  }

  findOne(id: string, tenantId: string) {
    return this.prisma.auditLog.findFirst({ where: { id, tenantId } });
  }

  async stats(tenantId: string, from?: string, to?: string) {
    const dateFilter = { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) };
    const createdAt = Object.keys(dateFilter).length ? dateFilter : undefined;

    const [byModule, bySeverity, total] = await Promise.all([
      this.prisma.auditLog.groupBy({
        by: ['module'],
        where: { tenantId, ...(createdAt && { createdAt }) },
        _count: { id: true },
      }),
      this.prisma.auditLog.groupBy({
        by: ['severity'],
        where: { tenantId, ...(createdAt && { createdAt }) },
        _count: { id: true },
      }),
      this.prisma.auditLog.count({ where: { tenantId, ...(createdAt && { createdAt }) } }),
    ]);

    return { total, byModule, bySeverity };
  }

  async log(params: AuditParams): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        module: params.module,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        before: params.before as Prisma.InputJsonValue,
        after: params.after as Prisma.InputJsonValue,
        metadata: params.metadata as Prisma.InputJsonValue,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        correlationId: params.correlationId,
        severity: params.severity ?? 'INFO',
      },
    });
  }
}
