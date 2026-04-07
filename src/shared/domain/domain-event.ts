import { randomUUID } from 'crypto';

export interface IDomainEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly tenantId: string;
  readonly occurredAt: Date;
  readonly payload: Record<string, unknown>;
}

export abstract class DomainEvent implements IDomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;

  constructor(
    public readonly eventType: string,
    public readonly tenantId: string,
    public readonly aggregateId: string,
    public readonly payload: Record<string, unknown>,
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}
