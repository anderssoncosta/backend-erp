import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { UpdateContractDto } from '../use-cases/update-contract/update-contract.dto';
import { AddServiceTypeDto } from '../use-cases/add-service-type/add-service-type.dto';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  list(
    tenantId: string,
    clientId?: string,
    status?: string,
    type?: string,
    expiringDays?: number,
    page: number = 1,
    limit: number = 20,
  ) {
    const expiryFilter = expiringDays ? { endDate: { lte: new Date(Date.now() + expiringDays * 86400000) } } : {};
    return this.prisma.contract.findMany({
      where: { tenantId, deletedAt: null, ...(clientId && { clientId }), ...(status && { status }), ...(type && { type }), ...expiryFilter },
      include: { client: { select: { id: true, name: true } }, serviceTypes: true, _count: { select: { serviceOrders: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit), take: Number(limit),
    });
  }

  findOne(id: string, tenantId: string) {
    return this.prisma.contract.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { client: true, serviceTypes: true, serviceOrders: { take: 10, orderBy: { createdAt: 'desc' } } },
    });
  }

  async update(id: string, dto: UpdateContractDto, tenantId: string) {
    const contract = await this.prisma.contract.findFirst({ where: { id, tenantId } });
    if (!contract) throw new NotFoundException('Contract not found');
    return this.prisma.contract.update({ where: { id }, data: { ...dto, endDate: dto.endDate ? new Date(dto.endDate) : undefined, slaPolicy: dto.slaPolicy as object } });
  }

  activate(id: string) {
    return this.prisma.contract.update({ where: { id }, data: { status: 'ACTIVE' } });
  }

  suspend(id: string, reason?: string) {
    return this.prisma.contract.update({ where: { id }, data: { status: 'SUSPENDED', notes: reason } });
  }

  cancel(id: string, reason?: string) {
    return this.prisma.contract.update({ where: { id }, data: { status: 'CANCELLED', notes: reason, deletedAt: new Date() } });
  }

  renew(id: string, endDate: string, notes?: string) {
    return this.prisma.contract.update({ where: { id }, data: { endDate: new Date(endDate), status: 'ACTIVE', notes } });
  }

  addServiceType(contractId: string, dto: AddServiceTypeDto) {
    return this.prisma.contractServiceType.create({ data: { ...dto, contractId } });
  }

  removeServiceType(stId: string) {
    return this.prisma.contractServiceType.delete({ where: { id: stId } });
  }
}
