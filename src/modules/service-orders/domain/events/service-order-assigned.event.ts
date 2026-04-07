import { DomainEvent } from '@shared/domain/domain-event';

export class ServiceOrderAssignedEvent extends DomainEvent {
  static readonly EVENT_TYPE = 'service_order.assigned';

  constructor(tenantId: string, aggregateId: string, payload: Record<string, unknown>) {
    super(ServiceOrderAssignedEvent.EVENT_TYPE, tenantId, aggregateId, payload);
  }
}
