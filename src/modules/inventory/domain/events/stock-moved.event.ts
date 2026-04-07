import { DomainEvent } from '@shared/domain/domain-event';

export class StockMovedEvent extends DomainEvent {
  static readonly EVENT_TYPE = 'inventory.stock_moved';
  constructor(tenantId: string, aggregateId: string, payload: Record<string, unknown>) {
    super(StockMovedEvent.EVENT_TYPE, tenantId, aggregateId, payload);
  }
}
