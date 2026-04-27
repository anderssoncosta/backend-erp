import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@Injectable()
export class CallCenterService {
  constructor(private readonly prisma: PrismaService) {}

  registerCall(
    tenantId: string,
    attendantId: string,
    body: {
      clientPhone: string;
      subject: string;
      description?: string;
      clientId?: string;
      clientName?: string;
      channel?: string;
      serviceOrderId?: string;
      notes?: string;
    },
  ) {
    return this.prisma.callRecord.create({
      data: {
        tenantId,
        attendantId,
        clientPhone: body.clientPhone,
        subject: body.subject,
        description: body.description,
        clientId: body.clientId,
        clientName: body.clientName,
        channel: body.channel ?? 'PHONE',
        serviceOrderId: body.serviceOrderId,
        notes: body.notes,
        startedAt: new Date(),
        status: 'ACTIVE',
      },
    });
  }

  async endCall(id: string, tenantId: string, notes?: string, outcome?: string) {
    const call = await this.prisma.callRecord.findFirst({ where: { id, tenantId } });
    if (!call) throw new Error('Call not found');

    const endedAt = new Date();
    const duration = Math.round((endedAt.getTime() - call.startedAt.getTime()) / 1000);

    return this.prisma.callRecord.update({
      where: { id },
      data: {
        endedAt,
        duration,
        status: 'COMPLETED',
        ...(outcome && { outcome }),
        ...(notes && { notes }),
      },
    });
  }

  list(
    tenantId: string,
    attendantId?: string,
    clientId?: string,
    status?: string,
    from?: string,
    to?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const dateFilter = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };
    const startedAt = Object.keys(dateFilter).length ? dateFilter : undefined;

    return this.prisma.callRecord.findMany({
      where: {
        tenantId,
        ...(attendantId && { attendantId }),
        ...(clientId && { clientId }),
        ...(status && { status }),
        ...(startedAt && { startedAt }),
      },
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async stats(tenantId: string, from?: string, to?: string) {
    const dateFilter = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };
    const startedAt = Object.keys(dateFilter).length ? dateFilter : undefined;

    const [total, byChannel, byAttendant] = await Promise.all([
      this.prisma.callRecord.count({ where: { tenantId, ...(startedAt && { startedAt }) } }),
      this.prisma.callRecord.groupBy({
        by: ['channel'],
        where: { tenantId, ...(startedAt && { startedAt }) },
        _count: { id: true },
      }),
      this.prisma.callRecord.groupBy({
        by: ['attendantId'],
        where: { tenantId, ...(startedAt && { startedAt }) },
        _count: { id: true },
        _avg: { duration: true },
      }),
    ]);

    return { total, byChannel, byAttendant };
  }
}
