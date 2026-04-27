import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@Injectable()
export class SafetyService {
  constructor(private readonly prisma: PrismaService) {}

  createDocument(
    tenantId: string,
    userId: string,
    body: { type: string; title: string; description?: string; expiresAt?: string; fileUrl?: string; userId?: string; issuedAt?: string },
  ) {
    return this.prisma.safetyDocument.create({
      data: {
        tenantId,
        type: body.type,
        title: body.title,
        description: body.description,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
        issuedAt: body.issuedAt ? new Date(body.issuedAt) : undefined,
        fileUrl: body.fileUrl,
        userId: body.userId ?? userId,
        status: 'VALID',
      },
    });
  }

  listDocuments(tenantId: string, type?: string, userId?: string, status?: string, page: number = 1, limit: number = 20) {
    return this.prisma.safetyDocument.findMany({
      where: { tenantId, ...(type && { type }), ...(userId && { userId }), ...(status && { status }) },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });
  }

  registerPPE(
    tenantId: string,
    receivedById: string,
    body: { userId: string; item: string; quantity: number; notes?: string },
  ) {
    return this.prisma.pPEDelivery.create({
      data: {
        tenantId,
        userId: body.userId,
        receivedById,
        item: body.item,
        quantity: body.quantity,
        deliveredAt: new Date(),
        notes: body.notes,
      },
    });
  }

  listPPE(tenantId: string, userId?: string, page: number = 1, limit: number = 20) {
    return this.prisma.pPEDelivery.findMany({
      where: { tenantId, ...(userId && { userId }) },
      orderBy: { deliveredAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });
  }

  reportIncident(
    tenantId: string,
    reportedById: string,
    body: { type: string; severity?: string; description: string; occurredAt?: string; location?: string; injuries?: boolean },
  ) {
    return this.prisma.incident.create({
      data: {
        tenantId,
        reportedById,
        type: body.type,
        severity: body.severity ?? 'MEDIUM',
        description: body.description,
        occurredAt: body.occurredAt ? new Date(body.occurredAt) : new Date(),
        location: body.location,
        injuries: body.injuries ?? false,
        status: 'OPEN',
      },
    });
  }

  listIncidents(tenantId: string, type?: string, severity?: string, status?: string, page: number = 1, limit: number = 20) {
    return this.prisma.incident.findMany({
      where: { tenantId, ...(type && { type }), ...(severity && { severity }), ...(status && { status }) },
      orderBy: { occurredAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });
  }

  closeIncident(id: string, tenantId: string, correctiveAction: string, resolvedAt?: string) {
    return this.prisma.incident.updateMany({
      where: { id, tenantId },
      data: {
        status: 'CLOSED',
        correctiveAction,
        resolvedAt: resolvedAt ? new Date(resolvedAt) : new Date(),
      },
    });
  }
}
