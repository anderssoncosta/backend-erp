import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  IServiceOrderRepository,
  SERVICE_ORDER_REPOSITORY,
} from '../../../domain/repositories/service-order.repository.interface';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { EntityNotFoundException } from '@shared/exceptions/not-found.exception';
import { CancelServiceOrderDto } from './cancel-service-order.dto';
import { ServiceOrder } from '../../../domain/entities/service-order.entity';

@Injectable()
export class CancelServiceOrderUseCase {
  constructor(
    @Inject(SERVICE_ORDER_REPOSITORY)
    private readonly repository: IServiceOrderRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    id: string,
    dto: CancelServiceOrderDto,
    tenantId: string,
    actorId: string,
  ): Promise<ServiceOrder> {
    const order = await this.repository.findById(id, tenantId);
    if (!order) throw new EntityNotFoundException('ServiceOrder', id);

    const fromStatus = order.status;
    order.cancel(dto.reason, actorId);

    const saved = await this.repository.update(order);

    await this.prisma.serviceOrderHistory.create({
      data: {
        serviceOrderId: id,
        actorId,
        action: 'CANCELLED',
        fromValue: fromStatus,
        toValue: order.status,
        metadata: { reason: dto.reason },
      },
    });

    const events = order.collectDomainEvents();
    for (const event of events) {
      this.eventEmitter.emit(event.eventType, event);
    }

    return saved;
  }
}
