import { DomainEvent } from '@shared/domain/domain-event';

export class StockLowEvent extends DomainEvent {
  static readonly EVENT_TYPE = 'inventory.stock_low';
  constructor(tenantId: string, aggregateId: string, payload: Record<string, unknown>) {
    super(StockLowEvent.EVENT_TYPE, tenantId, aggregateId, payload);
  }
}
