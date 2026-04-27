import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@Injectable()
export class FieldExecutionService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string, userId?: string, serviceOrderId?: string, status?: string, page: number = 1, limit: number = 20) {
    return this.prisma.fieldExecution.findMany({
      where: { tenantId, ...(userId && { userId }), ...(serviceOrderId && { serviceOrderId }), ...(status && { status }) },
      orderBy: { checkInAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });
  }

  findOne(id: string, tenantId: string) {
    return this.prisma.fieldExecution.findFirst({
      where: { id, tenantId },
      include: { checklists: true, evidences: true },
    });
  }

  addEvidence(executionId: string, body: { type: string; url: string; description?: string }) {
    return this.prisma.fieldEvidence.create({
      data: { executionId, type: body.type, url: body.url, description: body.description },
    });
  }

  saveChecklist(executionId: string, body: { question: string; passed?: boolean; notes?: string; order?: number }) {
    return this.prisma.fieldChecklist.create({
      data: { executionId, question: body.question, passed: body.passed, notes: body.notes, order: body.order ?? 0 },
    });
  }
}
