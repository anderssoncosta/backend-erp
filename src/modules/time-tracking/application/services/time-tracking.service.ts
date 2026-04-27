import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@Injectable()
export class TimeTrackingService {
  constructor(private readonly prisma: PrismaService) {}

  async start(tenantId: string, userId: string, body: { type?: string; description?: string; serviceOrderId?: string }) {
    const active = await this.prisma.timeEntry.findFirst({
      where: { tenantId, userId, endedAt: null, status: 'RUNNING' },
    });
    if (active) {
      throw new BadRequestException('You already have an active time entry. Stop it first.');
    }

    return this.prisma.timeEntry.create({
      data: {
        tenantId,
        userId,
        startedAt: new Date(),
        type: body.type ?? 'REGULAR',
        description: body.description,
        serviceOrderId: body.serviceOrderId,
        status: 'RUNNING',
      },
    });
  }

  async stop(id: string, tenantId: string, userId: string, description?: string) {
    const entry = await this.prisma.timeEntry.findFirst({
      where: { id, tenantId, userId, endedAt: null },
    });
    if (!entry) {
      throw new NotFoundException('Active time entry not found');
    }

    const endedAt = new Date();
    const durationMinutes = Math.round((endedAt.getTime() - entry.startedAt.getTime()) / 60000);

    return this.prisma.timeEntry.update({
      where: { id },
      data: {
        endedAt,
        durationMinutes,
        status: 'COMPLETED',
        ...(description && { description }),
      },
    });
  }

  list(tenantId: string, userId?: string, serviceOrderId?: string, from?: string, to?: string, page: number = 1, limit: number = 50) {
    const dateFilter = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };
    const startedAt = Object.keys(dateFilter).length ? dateFilter : undefined;

    return this.prisma.timeEntry.findMany({
      where: { tenantId, ...(userId && { userId }), ...(serviceOrderId && { serviceOrderId }), ...(startedAt && { startedAt }) },
      orderBy: { startedAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });
  }

  summary(tenantId: string, from?: string, to?: string) {
    const dateFilter = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };
    const startedAt = Object.keys(dateFilter).length ? dateFilter : undefined;

    return this.prisma.timeEntry.groupBy({
      by: ['userId'],
      where: { tenantId, endedAt: { not: null }, ...(startedAt && { startedAt }) },
      _sum: { durationMinutes: true },
      _count: { id: true },
    });
  }
}
