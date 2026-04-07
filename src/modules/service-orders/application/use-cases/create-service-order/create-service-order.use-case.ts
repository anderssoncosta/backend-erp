import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  IServiceOrderRepository,
  SERVICE_ORDER_REPOSITORY,
} from '../../../domain/repositories/service-order.repository.interface';
import { SlaCalculatorService } from '../../../domain/services/sla-calculator.service';
import { ServiceOrder } from '../../../domain/entities/service-order.entity';
import { PriorityLevel } from '../../../domain/value-objects/priority-level.vo';
import { CreateServiceOrderDto } from './create-service-order.dto';

@Injectable()
export class CreateServiceOrderUseCase {
  constructor(
    @Inject(SERVICE_ORDER_REPOSITORY)
    private readonly repository: IServiceOrderRepository,
    private readonly slaCalculator: SlaCalculatorService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    dto: CreateServiceOrderDto,
    tenantId: string,
    actorId: string,
  ): Promise<ServiceOrder> {
    const orderNumber = await this.repository.generateOrderNumber(tenantId);
    const priority = dto.priority ?? PriorityLevel.MEDIUM;
    const slaDeadline = this.slaCalculator.calculateDeadline(priority);

    const order = ServiceOrder.create({
      tenantId,
      branchId: dto.branchId,
      clientId: dto.clientId,
      contractId: dto.contractId,
      orderNumber,
      title: dto.title,
      description: dto.description,
      type: dto.type,
      priority,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      slaDeadline,
      address: dto.address,
      createdById: actorId,
    });

    const saved = await this.repository.save(order);

    const events = order.collectDomainEvents();
    for (const event of events) {
      this.eventEmitter.emit(event.eventType, event);
    }

    return saved;
  }
}
