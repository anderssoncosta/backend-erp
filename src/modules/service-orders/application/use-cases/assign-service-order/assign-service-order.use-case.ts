import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  IServiceOrderRepository,
  SERVICE_ORDER_REPOSITORY,
} from '../../../domain/repositories/service-order.repository.interface';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { EntityNotFoundException } from '@shared/exceptions/not-found.exception';
import { AssignServiceOrderDto } from './assign-service-order.dto';
import { ServiceOrder } from '../../../domain/entities/service-order.entity';

@Injectable()
export class AssignServiceOrderUseCase {
  constructor(
    @Inject(SERVICE_ORDER_REPOSITORY)
    private readonly repository: IServiceOrderRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    id: string,
    dto: AssignServiceOrderDto,
    tenantId: string,
    actorId: string,
  ): Promise<ServiceOrder> {
    const order = await this.repository.findById(id, tenantId);
    if (!order) throw new EntityNotFoundException('ServiceOrder', id);

    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, tenantId, deletedAt: null },
    });
    if (!user) throw new EntityNotFoundException('User', dto.userId);

    order.assign(dto.userId, actorId);

    await this.prisma.serviceOrderAssignment.create({
      data: {
        serviceOrderId: id,
        userId: dto.userId,
        assignedById: actorId,
      },
    });

    const saved = await this.repository.update(order);

    const events = order.collectDomainEvents();
    for (const event of events) {
      this.eventEmitter.emit(event.eventType, event);
    }

    return saved;
  }
}
