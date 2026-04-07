import { BaseEntity, BaseEntityProps } from './base-entity';
import { IDomainEvent } from './domain-event';

export abstract class BaseAggregate extends BaseEntity {
  private _domainEvents: IDomainEvent[] = [];

  constructor(props: BaseEntityProps) {
    super(props);
  }

  protected addDomainEvent(event: IDomainEvent): void {
    this._domainEvents.push(event);
  }

  collectDomainEvents(): IDomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  hasDomainEvents(): boolean {
    return this._domainEvents.length > 0;
  }

  get domainEventsCount(): number {
    return this._domainEvents.length;
  }
}
