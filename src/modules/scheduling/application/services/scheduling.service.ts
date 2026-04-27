import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@Injectable()
export class SchedulingService {
  constructor(private readonly prisma: PrismaService) {}

  list(
    tenantId: string,
    userId?: string,
    from?: string,
    to?: string,
    status?: string,
    page: number = 1,
    limit: number = 50,
  ) {
    const dateFilter = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };
    const scheduledDate = Object.keys(dateFilter).length ? dateFilter : undefined;

    return this.prisma.schedule.findMany({
      where: {
        tenantId,
        ...(userId && { userId }),
        ...(status && { status }),
        ...(scheduledDate && { scheduledDate }),
      },
      orderBy: { scheduledDate: 'asc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });
  }

  findOne(id: string, tenantId: string) {
    return this.prisma.schedule.findFirst({ where: { id, tenantId } });
  }

  cancel(id: string, tenantId: string, reason?: string) {
    return this.prisma.schedule.updateMany({
      where: { id, tenantId },
      data: { status: 'CANCELLED', cancelReason: reason },
    });
  }
}
