import { DomainEvent } from '@shared/domain/domain-event';

export class InvoiceIssuedEvent extends DomainEvent {
  static readonly EVENT_TYPE = 'financial.invoice.issued';

  constructor(payload: { tenantId: string; invoiceId: string; number: string; totalAmount: number }) {
    super(InvoiceIssuedEvent.EVENT_TYPE, payload.tenantId, payload.invoiceId, payload as Record<string, unknown>);
  }
}
