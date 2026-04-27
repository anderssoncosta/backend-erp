import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    tenantId: string,
    managerId: string,
    body: {
      code: string; name: string; description?: string; clientId?: string; contractId?: string;
      managerId?: string; startDate?: string; endDate?: string; budget?: number;
    },
  ) {
    return this.prisma.project.create({
      data: {
        tenantId,
        code: body.code,
        name: body.name,
        description: body.description,
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

  list(tenantId: string, status?: string, clientId?: string, managerId?: string, page: number = 1, limit: number = 20) {
    return this.prisma.project.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(status && { status }),
        ...(clientId && { clientId }),
        ...(managerId && { managerId }),
      },
      include: { _count: { select: { phases: true, tasks: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  findOne(id: string, tenantId: string) {
    return this.prisma.project.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        phases: { include: { tasks: true }, orderBy: { order: 'asc' } },
        tasks: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  updateStatus(id: string, tenantId: string, status: string, progress?: number) {
    return this.prisma.project.updateMany({
      where: { id, tenantId },
      data: { status, ...(progress !== undefined && { progress }) },
    });
  }

  createPhase(
    projectId: string,
    body: { name: string; description?: string; order?: number; startDate?: string; endDate?: string },
  ) {
    return this.prisma.projectPhase.create({
      data: {
        projectId,
        name: body.name,
        description: body.description,
        order: body.order ?? 1,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        status: 'PENDING',
      },
    });
  }

  createTask(
    projectId: string,
    tenantId: string,
    body: {
      phaseId?: string; title: string; description?: string;
      assignedToId?: string; dueDate?: string; priority?: string;
    },
  ) {
    return this.prisma.projectTask.create({
      data: {
        tenantId,
        projectId,
        phaseId: body.phaseId,
        title: body.title,
        description: body.description,
        assignedToId: body.assignedToId,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        priority: body.priority ?? 'MEDIUM',
        status: 'TODO',
      },
    });
  }

  updateTaskStatus(taskId: string, tenantId: string, status: string, completedAt?: string) {
    return this.prisma.projectTask.updateMany({
      where: { id: taskId, tenantId },
      data: {
        status,
        ...(completedAt && { completedAt: new Date(completedAt) }),
        ...(status === 'DONE' && !completedAt && { completedAt: new Date() }),
      },
    });
  }
}
