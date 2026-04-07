import { ServiceOrder } from '../entities/service-order.entity';
import { ServiceOrderStatus } from '../value-objects/service-order-status.vo';
import { PaginatedResult } from '@shared/domain/value-objects/pagination.vo';

export const SERVICE_ORDER_REPOSITORY = 'SERVICE_ORDER_REPOSITORY';

export interface ListServiceOrdersFilter {
  tenantId: string;
  branchId?: string;
  clientId?: string;
  status?: ServiceOrderStatus | ServiceOrderStatus[];
  priority?: string;
  type?: string;
  assignedUserId?: string;
  slaBreached?: boolean;
  search?: string;
  scheduledFrom?: Date;
  scheduledTo?: Date;
  page?: number;
  limit?: number;
}

export interface IServiceOrderRepository {
  findById(id: string, tenantId: string): Promise<ServiceOrder | null>;
  findByOrderNumber(orderNumber: string, tenantId: string): Promise<ServiceOrder | null>;
  findMany(filter: ListServiceOrdersFilter): Promise<PaginatedResult<ServiceOrder>>;
  findBreachingSla(tenantId: string): Promise<ServiceOrder[]>;
  generateOrderNumber(tenantId: string): Promise<string>;
  save(entity: ServiceOrder): Promise<ServiceOrder>;
  update(entity: ServiceOrder): Promise<ServiceOrder>;
  delete(id: string, tenantId: string): Promise<void>;
}
