import { DomainEvent } from '@shared/domain/domain-event';

export class ExpenseApprovedEvent extends DomainEvent {
  static readonly EVENT_TYPE = 'financial.expense.approved';

  constructor(payload: { tenantId: string; expenseId: string; amount: number; approvedBy: string }) {
    super(ExpenseApprovedEvent.EVENT_TYPE, payload.tenantId, payload.expenseId, payload as Record<string, unknown>);
  }
}
