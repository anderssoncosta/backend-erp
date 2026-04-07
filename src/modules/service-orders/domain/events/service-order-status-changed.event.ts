import { DomainEvent } from '@shared/domain/domain-event';

export class ServiceOrderStatusChangedEvent extends DomainEvent {
  static readonly EVENT_TYPE = 'service_order.status_changed';

  constructor(tenantId: string, aggregateId: string, payload: Record<string, unknown>) {
    super(ServiceOrderStatusChangedEvent.EVENT_TYPE, tenantId, aggregateId, payload);
  }
}
