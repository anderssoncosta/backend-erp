import { Inject, Injectable } from '@nestjs/common';
import {
  IServiceOrderRepository,
  SERVICE_ORDER_REPOSITORY,
} from '../../../domain/repositories/service-order.repository.interface';
import { ServiceOrder } from '../../../domain/entities/service-order.entity';
import { EntityNotFoundException } from '@shared/exceptions/not-found.exception';

@Injectable()
export class GetServiceOrderUseCase {
  constructor(
    @Inject(SERVICE_ORDER_REPOSITORY)
    private readonly repository: IServiceOrderRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<ServiceOrder> {
    const order = await this.repository.findById(id, tenantId);
    if (!order) {
      throw new EntityNotFoundException('ServiceOrder', id);
    }
    return order;
  }
}
