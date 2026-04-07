import { DomainEvent } from '@shared/domain/domain-event';

export class InvoicePaidEvent extends DomainEvent {
  static readonly EVENT_TYPE = 'financial.invoice.paid';

  constructor(payload: { tenantId: string; invoiceId: string; number: string; totalAmount: number }) {
    super(InvoicePaidEvent.EVENT_TYPE, payload.tenantId, payload.invoiceId, payload as Record<string, unknown>);
  }
}
