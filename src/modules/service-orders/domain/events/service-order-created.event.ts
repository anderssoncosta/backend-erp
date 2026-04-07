import { DomainEvent } from '@shared/domain/domain-event';

export class ServiceOrderCreatedEvent extends DomainEvent {
  static readonly EVENT_TYPE = 'service_order.created';

  constructor(
    tenantId: string,
    aggregateId: string,
    payload: Record<string, unknown>,
  ) {
    super(ServiceOrderCreatedEvent.EVENT_TYPE, tenantId, aggregateId, payload);
  }
}
