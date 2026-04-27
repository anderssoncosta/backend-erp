import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@Injectable()
export class WorksService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    tenantId: string,
    managerId: string,
    body: {
      code: string; name: string; type: string; description?: string;
      clientId?: string; contractId?: string; managerId?: string;
      startDate?: string; endDate?: string; budget?: number;
    },
  ) {
    return this.prisma.work.create({
      data: {
        tenantId,
        code: body.code,
        name: body.name,
        type: body.type,
        clientId: body.clientId,
        contractId: body.contractId,
        managerId: body.managerId ?? managerId,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        budget: body.budget,
        status: 'PLANNING',
      },
    });
  }

  list(tenantId: string, status?: string, type?: string, clientId?: string, page: number = 1, limit: number = 20) {
    return this.prisma.work.findMany({
      where: { tenantId, deletedAt: null, ...(status && { status }), ...(type && { type }), ...(clientId && { clientId }) },
      include: { _count: { select: { fronts: true, measurements: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });
  }

  findOne(id: string, tenantId: string) {
    return this.prisma.work.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { fronts: true, measurements: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
  }

  updateStatus(id: string, tenantId: string, status: string, progress?: number) {
    return this.prisma.work.updateMany({
      where: { id, tenantId },
      data: { status, ...(progress !== undefined && { progress }) },
    });
  }

  createFront(workId: string, tenantId: string, body: { name: string; supervisorId?: string; notes?: string }) {
    return this.prisma.workFront.create({
      data: { tenantId, workId, name: body.name, supervisorId: body.supervisorId, notes: body.notes, status: 'ACTIVE' },
    });
  }

  addMeasurement(
    workId: string,
    tenantId: string,
    measuredById: string,
    body: { description: string; period: string; value: number; approvedById?: string; notes?: string },
  ) {
    return this.prisma.workMeasurement.create({
      data: {
        tenantId,
        workId,
        measuredById,
        description: body.description,
        period: body.period,
        value: body.value,
        approvedById: body.approvedById,
        approvedAt: body.approvedById ? new Date() : undefined,
        notes: body.notes,
        status: body.approvedById ? 'APPROVED' : 'PENDING',
      },
    });
  }
}
