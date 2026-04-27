import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@Injectable()
export class HelpdeskService {
  constructor(private readonly prisma: PrismaService) {}

  createTicket(
    tenantId: string,
    requesterId: string,
    body: { title: string; description: string; category: string; priority?: string; assignedToId?: string; serviceOrderId?: string },
  ) {
    return this.prisma.ticket.create({
      data: {
        tenantId,
        title: body.title,
        description: body.description,
        category: body.category,
        priority: body.priority ?? 'MEDIUM',
        requesterId,
        assignedToId: body.assignedToId,
        serviceOrderId: body.serviceOrderId,
        status: 'OPEN',
      },
    });
  }

  listTickets(tenantId: string, status?: string, priority?: string, assignedToId?: string, page: number = 1, limit: number = 20) {
    return this.prisma.ticket.findMany({
      where: { tenantId, ...(status && { status }), ...(priority && { priority }), ...(assignedToId && { assignedToId }) },
      include: { _count: { select: { comments: true } } },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });
  }

  getTicket(id: string, tenantId: string) {
    return this.prisma.ticket.findFirst({
      where: { id, tenantId },
      include: { comments: { orderBy: { createdAt: 'asc' } } },
    });
  }

  updateTicket(
    id: string,
    tenantId: string,
    body: { status?: string; priority?: string; assignedToId?: string; resolvedAt?: string; resolution?: string },
  ) {
    return this.prisma.ticket.updateMany({
      where: { id, tenantId },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.priority && { priority: body.priority }),
        ...(body.assignedToId !== undefined && { assignedToId: body.assignedToId }),
        ...(body.resolvedAt && { resolvedAt: new Date(body.resolvedAt) }),
        ...(body.resolution && { resolution: body.resolution }),
        ...(body.status === 'RESOLVED' && !body.resolvedAt && { resolvedAt: new Date() }),
        ...(body.status === 'CLOSED' && { closedAt: new Date() }),
      },
    });
  }

  addComment(ticketId: string, authorId: string, content: string, isInternal: boolean = false) {
    return this.prisma.ticketComment.create({
      data: { ticketId, authorId, content, isInternal },
    });
  }
}
