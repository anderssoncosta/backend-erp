import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@Injectable()
export class HrService {
  constructor(private readonly prisma: PrismaService) {}

  createPosition(tenantId: string, body: { name: string; description?: string; level?: string; cbo?: string }) {
    return this.prisma.position.create({ data: { tenantId, ...body } });
  }

  listPositions(tenantId: string) {
    return this.prisma.position.findMany({
      where: { tenantId, isActive: true },
      include: { _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    });
  }

  createEmployee(
    tenantId: string,
    body: {
      name: string; positionId?: string; branchId?: string; userId?: string;
      cpf?: string; admissionDate: string; salary?: number; phone?: string; email?: string;
    },
  ) {
    return this.prisma.employee.create({
      data: {
        tenantId,
        name: body.name,
        userId: body.userId,
        positionId: body.positionId,
        branchId: body.branchId,
        cpf: body.cpf,
        admissionDate: new Date(body.admissionDate),
        salary: body.salary,
        phone: body.phone,
        email: body.email,
        status: 'ACTIVE',
      },
    });
  }

  listEmployees(
    tenantId: string,
    status?: string,
    positionId?: string,
    branchId?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    return this.prisma.employee.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(status && { status }),
        ...(positionId && { positionId }),
        ...(branchId && { branchId }),
      },
      include: { position: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  getEmployee(id: string, tenantId: string) {
    return this.prisma.employee.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { position: true },
    });
  }

  updateEmployee(
    id: string,
    tenantId: string,
    body: { positionId?: string; salary?: number; status?: string; phone?: string; email?: string },
  ) {
    return this.prisma.employee.updateMany({ where: { id, tenantId }, data: body });
  }

  terminate(id: string, tenantId: string, terminationDate: string, reason?: string) {
    return this.prisma.employee.updateMany({
      where: { id, tenantId },
      data: {
        status: 'TERMINATED',
        terminationDate: new Date(terminationDate),
        terminationReason: reason,
      },
    });
  }
}
