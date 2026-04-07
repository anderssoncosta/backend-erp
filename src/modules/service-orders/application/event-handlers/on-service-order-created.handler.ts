import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ServiceOrderCreatedEvent } from '../../domain/events/service-order-created.event';
import { QUEUE_NAMES } from '@shared/constants/queue-names.constant';

@Injectable()
export class OnServiceOrderCreatedHandler {
  private readonly logger = new Logger(OnServiceOrderCreatedHandler.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.NOTIFICATIONS)
    private readonly notificationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.AUDIT)
    private readonly auditQueue: Queue,
  ) {}

  @OnEvent(ServiceOrderCreatedEvent.EVENT_TYPE, { async: true })
  async handle(event: ServiceOrderCreatedEvent): Promise<void> {
    this.logger.debug(
      `Handling ${event.eventType} for SO: ${event.aggregateId}`,
    );

    await Promise.all([
      this.notificationQueue.add('notify-service-order-created', {
        tenantId: event.tenantId,
        serviceOrderId: event.aggregateId,
        payload: event.payload,
      }),
      this.auditQueue.add('write-audit', {
        tenantId: event.tenantId,
        userId: event.payload['createdById'],
        module: 'service-orders',
        action: 'create',
        entityType: 'ServiceOrder',
        entityId: event.aggregateId,
        after: event.payload,
        severity: 'INFO',
      }),
    ]);
  }
}
