import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import {
  IServiceOrderRepository,
  ListServiceOrdersFilter,
} from '../../domain/repositories/service-order.repository.interface';
import { ServiceOrder } from '../../domain/entities/service-order.entity';
import { ServiceOrderStatus } from '../../domain/value-objects/service-order-status.vo';
import { PriorityLevel } from '../../domain/value-objects/priority-level.vo';
import { PaginatedResult, Pagination } from '@shared/domain/value-objects/pagination.vo';

@Injectable()
export class ServiceOrderPrismaRepository implements IServiceOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tenantId: string): Promise<ServiceOrder | null> {
    const row = await this.prisma.serviceOrder.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByOrderNumber(orderNumber: string, tenantId: string): Promise<ServiceOrder | null> {
    const row = await this.prisma.serviceOrder.findFirst({
      where: { orderNumber, tenantId, deletedAt: null },
    });
    return row ? this.toDomain(row) : null;
  }

  async findMany(filter: ListServiceOrdersFilter): Promise<PaginatedResult<ServiceOrder>> {
    const pagination = new Pagination({ page: filter.page, limit: filter.limit });

    const where: Record<string, unknown> = {
      tenantId: filter.tenantId,
      deletedAt: null,
    };

    if (filter.branchId) where['branchId'] = filter.branchId;
    if (filter.clientId) where['clientId'] = filter.clientId;
    if (filter.status) {
      where['status'] = Array.isArray(filter.status)
        ? { in: filter.status }
        : filter.status;
    }
    if (filter.priority) where['priority'] = filter.priority;
    if (filter.type) where['type'] = filter.type;
    if (filter.slaBreached !== undefined) where['slaBreached'] = filter.slaBreached;
    if (filter.assignedUserId) {
      where['assignments'] = {
        some: { userId: filter.assignedUserId, isActive: true },
      };
    }
    if (filter.search) {
      where['OR'] = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { orderNumber: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    if (filter.scheduledFrom || filter.scheduledTo) {
      where['scheduledAt'] = {};
      if (filter.scheduledFrom) (where['scheduledAt'] as Record<string, unknown>)['gte'] = filter.scheduledFrom;
      if (filter.scheduledTo) (where['scheduledAt'] as Record<string, unknown>)['lte'] = filter.scheduledTo;
    }

    const [total, rows] = await Promise.all([
      this.prisma.serviceOrder.count({ where }),
      this.prisma.serviceOrder.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      }),
    ]);

    return {
      data: rows.map((r) => this.toDomain(r)),
      meta: Pagination.buildMeta(total, pagination.page, pagination.limit),
    };
  }

  async findBreachingSla(tenantId: string): Promise<ServiceOrder[]> {
    const rows = await this.prisma.serviceOrder.findMany({
      where: {
        tenantId,
        deletedAt: null,
        slaBreached: false,
        slaDeadline: { lt: new Date() },
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async generateOrderNumber(tenantId: string): Promise<string> {
    const count = await this.prisma.serviceOrder.count({ where: { tenantId } });
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `OS-${year}${month}-${String(count + 1).padStart(6, '0')}`;
  }

  async save(entity: ServiceOrder): Promise<ServiceOrder> {
    const row = await this.prisma.serviceOrder.create({
      data: {
        id: entity.id,
        tenantId: entity.tenantId,
        branchId: entity.branchId,
        clientId: entity.clientId ?? null,
        contractId: entity.contractId ?? null,
        orderNumber: entity.orderNumber,
        title: entity.title,
        description: entity.description ?? null,
        type: entity.type,
        status: entity.status,
        priority: entity.priority,
        scheduledAt: entity.scheduledAt ?? null,
        startedAt: entity.startedAt ?? null,
        completedAt: entity.completedAt ?? null,
        cancelledAt: entity.cancelledAt ?? null,
        cancelReason: entity.cancelReason ?? null,
        dueDate: entity.dueDate ?? null,
        slaDeadline: entity.slaDeadline ?? null,
        slaBreached: entity.slaBreached,
        address: (entity.address as object) ?? undefined,
        metadata: (entity.metadata as object) ?? {},
        createdById: entity.createdById,
      },
    });
    return this.toDomain(row);
  }

  async update(entity: ServiceOrder): Promise<ServiceOrder> {
    const row = await this.prisma.serviceOrder.update({
      where: { id: entity.id },
      data: {
        title: entity.title,
        description: entity.description ?? null,
        type: entity.type,
        status: entity.status,
        priority: entity.priority,
        scheduledAt: entity.scheduledAt ?? null,
        startedAt: entity.startedAt ?? null,
        completedAt: entity.completedAt ?? null,
        cancelledAt: entity.cancelledAt ?? null,
        cancelReason: entity.cancelReason ?? null,
        dueDate: entity.dueDate ?? null,
        slaDeadline: entity.slaDeadline ?? null,
        slaBreached: entity.slaBreached,
        address: (entity.address as object) ?? undefined,
        metadata: (entity.metadata as object) ?? {},
        updatedAt: entity.updatedAt,
      },
    });
    return this.toDomain(row);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.serviceOrder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private toDomain(row: {
    id: string;
    tenantId: string;
    branchId: string;
    clientId: string | null;
    contractId: string | null;
    orderNumber: string;
    title: string;
    description: string | null;
    type: string;
    status: string;
    priority: string;
    scheduledAt: Date | null;
    startedAt: Date | null;
    completedAt: Date | null;
    cancelledAt: Date | null;
    cancelReason: string | null;
    dueDate: Date | null;
    slaDeadline: Date | null;
    slaBreached: boolean;
    address: unknown;
    metadata: unknown;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
  }): ServiceOrder {
    return new ServiceOrder({
      id: row.id,
      tenantId: row.tenantId,
      branchId: row.branchId,
      clientId: row.clientId ?? undefined,
      contractId: row.contractId ?? undefined,
      orderNumber: row.orderNumber,
      title: row.title,
      description: row.description ?? undefined,
      type: row.type,
      status: row.status as ServiceOrderStatus,
      priority: row.priority as PriorityLevel,
      scheduledAt: row.scheduledAt ?? undefined,
      startedAt: row.startedAt ?? undefined,
      completedAt: row.completedAt ?? undefined,
      cancelledAt: row.cancelledAt ?? undefined,
      cancelReason: row.cancelReason ?? undefined,
      dueDate: row.dueDate ?? undefined,
      slaDeadline: row.slaDeadline ?? undefined,
      slaBreached: row.slaBreached,
      address: row.address ? (row.address as Record<string, unknown>) : undefined,
      metadata: row.metadata ? (row.metadata as Record<string, unknown>) : {},
      createdById: row.createdById,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
