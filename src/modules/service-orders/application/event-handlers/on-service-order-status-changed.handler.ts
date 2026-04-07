import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ServiceOrderStatusChangedEvent } from '../../domain/events/service-order-status-changed.event';
import { QUEUE_NAMES } from '@shared/constants/queue-names.constant';

@Injectable()
export class OnServiceOrderStatusChangedHandler {
  private readonly logger = new Logger(OnServiceOrderStatusChangedHandler.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.NOTIFICATIONS)
    private readonly notificationQueue: Queue,
  ) {}

  @OnEvent(ServiceOrderStatusChangedEvent.EVENT_TYPE, { async: true })
  async handle(event: ServiceOrderStatusChangedEvent): Promise<void> {
    this.logger.debug(
      `SO ${event.aggregateId} status changed: ${event.payload['fromStatus']} → ${event.payload['toStatus']}`,
    );

    await this.notificationQueue.add('notify-status-changed', {
      tenantId: event.tenantId,
      serviceOrderId: event.aggregateId,
      fromStatus: event.payload['fromStatus'],
      toStatus: event.payload['toStatus'],
      actorId: event.payload['actorId'],
    });
  }
}
