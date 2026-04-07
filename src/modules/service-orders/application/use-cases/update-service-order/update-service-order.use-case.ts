import { Inject, Injectable } from '@nestjs/common';
import {
  IServiceOrderRepository,
  SERVICE_ORDER_REPOSITORY,
} from '../../../domain/repositories/service-order.repository.interface';
import { UpdateServiceOrderDto } from './update-service-order.dto';
import { ServiceOrder } from '../../../domain/entities/service-order.entity';
import { EntityNotFoundException } from '@shared/exceptions/not-found.exception';

@Injectable()
export class UpdateServiceOrderUseCase {
  constructor(
    @Inject(SERVICE_ORDER_REPOSITORY)
    private readonly repository: IServiceOrderRepository,
  ) {}

  async execute(
    id: string,
    dto: UpdateServiceOrderDto,
    tenantId: string,
  ): Promise<ServiceOrder> {
    const order = await this.repository.findById(id, tenantId);
    if (!order) throw new EntityNotFoundException('ServiceOrder', id);

    order.update({
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      address: dto.address,
    });

    return this.repository.update(order);
  }
}
