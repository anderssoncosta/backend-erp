import { Inject, Injectable } from '@nestjs/common';
import {
  IServiceOrderRepository,
  SERVICE_ORDER_REPOSITORY,
} from '../../../domain/repositories/service-order.repository.interface';
import { ListServiceOrdersQueryDto } from './list-service-orders.query.dto';
import { PaginatedResult } from '@shared/domain/value-objects/pagination.vo';
import { ServiceOrder } from '../../../domain/entities/service-order.entity';

@Injectable()
export class ListServiceOrdersUseCase {
  constructor(
    @Inject(SERVICE_ORDER_REPOSITORY)
    private readonly repository: IServiceOrderRepository,
  ) {}

  async execute(
    query: ListServiceOrdersQueryDto,
    tenantId: string,
  ): Promise<PaginatedResult<ServiceOrder>> {
    return this.repository.findMany({
      tenantId,
      branchId: query.branchId,
      clientId: query.clientId,
      status: query.status,
      priority: query.priority,
      type: query.type,
      assignedUserId: query.assignedUserId,
      search: query.search,
      scheduledFrom: query.scheduledFrom ? new Date(query.scheduledFrom) : undefined,
      scheduledTo: query.scheduledTo ? new Date(query.scheduledTo) : undefined,
      page: query.page,
      limit: query.limit,
    });
  }
}
