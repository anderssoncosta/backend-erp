import { BaseAggregate } from '@shared/domain/base-aggregate';
import {
  ServiceOrderStatus,
  canTransition,
} from '../value-objects/service-order-status.vo';
import { PriorityLevel } from '../value-objects/priority-level.vo';
import { ServiceOrderCreatedEvent } from '../events/service-order-created.event';
import { ServiceOrderStatusChangedEvent } from '../events/service-order-status-changed.event';
import { ServiceOrderAssignedEvent } from '../events/service-order-assigned.event';

export interface ServiceOrderProps {
  id?: string;
  tenantId: string;
  branchId: string;
  clientId?: string;
  contractId?: string;
  orderNumber: string;
  title: string;
  description?: string;
  type: string;
  status?: ServiceOrderStatus;
  priority?: PriorityLevel;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  dueDate?: Date;
  slaDeadline?: Date;
  slaBreached?: boolean;
  address?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdById: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ServiceOrder extends BaseAggregate {
  private _tenantId: string;
  private _branchId: string;
  private _clientId: string | undefined;
  private _contractId: string | undefined;
  private _orderNumber: string;
  private _title: string;
  private _description: string | undefined;
  private _type: string;
  private _status: ServiceOrderStatus;
  private _priority: PriorityLevel;
  private _scheduledAt: Date | undefined;
  private _startedAt: Date | undefined;
  private _completedAt: Date | undefined;
  private _cancelledAt: Date | undefined;
  private _cancelReason: string | undefined;
  private _dueDate: Date | undefined;
  private _slaDeadline: Date | undefined;
  private _slaBreached: boolean;
  private _address: Record<string, unknown> | undefined;
  private _metadata: Record<string, unknown>;
  private _createdById: string;

  constructor(props: ServiceOrderProps) {
    super({ id: props.id, createdAt: props.createdAt, updatedAt: props.updatedAt });
    this._tenantId = props.tenantId;
    this._branchId = props.branchId;
    this._clientId = props.clientId;
    this._contractId = props.contractId;
    this._orderNumber = props.orderNumber;
    this._title = props.title;
    this._description = props.description;
    this._type = props.type;
    this._status = props.status ?? ServiceOrderStatus.OPEN;
    this._priority = props.priority ?? PriorityLevel.MEDIUM;
    this._scheduledAt = props.scheduledAt;
    this._startedAt = props.startedAt;
    this._completedAt = props.completedAt;
    this._cancelledAt = props.cancelledAt;
    this._cancelReason = props.cancelReason;
    this._dueDate = props.dueDate;
    this._slaDeadline = props.slaDeadline;
    this._slaBreached = props.slaBreached ?? false;
    this._address = props.address;
    this._metadata = props.metadata ?? {};
    this._createdById = props.createdById;
  }

  // ── Getters ──────────────────────────────────────────────
  get tenantId(): string { return this._tenantId; }
  get branchId(): string { return this._branchId; }
  get clientId(): string | undefined { return this._clientId; }
  get contractId(): string | undefined { return this._contractId; }
  get orderNumber(): string { return this._orderNumber; }
  get title(): string { return this._title; }
  get description(): string | undefined { return this._description; }
  get type(): string { return this._type; }
  get status(): ServiceOrderStatus { return this._status; }
  get priority(): PriorityLevel { return this._priority; }
  get scheduledAt(): Date | undefined { return this._scheduledAt; }
  get startedAt(): Date | undefined { return this._startedAt; }
  get completedAt(): Date | undefined { return this._completedAt; }
  get cancelledAt(): Date | undefined { return this._cancelledAt; }
  get cancelReason(): string | undefined { return this._cancelReason; }
  get dueDate(): Date | undefined { return this._dueDate; }
  get slaDeadline(): Date | undefined { return this._slaDeadline; }
  get slaBreached(): boolean { return this._slaBreached; }
  get address(): Record<string, unknown> | undefined { return this._address; }
  get metadata(): Record<string, unknown> { return this._metadata; }
  get createdById(): string { return this._createdById; }

  // ── Factory ──────────────────────────────────────────────
  static create(props: ServiceOrderProps): ServiceOrder {
    const order = new ServiceOrder(props);
    order.addDomainEvent(
      new ServiceOrderCreatedEvent(props.tenantId, order.id, {
        orderNumber: order._orderNumber,
        title: order._title,
        type: order._type,
        priority: order._priority,
        branchId: order._branchId,
        createdById: order._createdById,
      }),
    );
    return order;
  }

  // ── Commands ──────────────────────────────────────────────
  assign(userId: string, assignedById: string): void {
    if (this._status === ServiceOrderStatus.CANCELLED) {
      throw new Error('Cannot assign a cancelled service order');
    }
    if (this._status === ServiceOrderStatus.COMPLETED) {
      throw new Error('Cannot assign a completed service order');
    }

    this._status = ServiceOrderStatus.ASSIGNED;
    this.touch();

    this.addDomainEvent(
      new ServiceOrderAssignedEvent(this._tenantId, this._id, {
        orderNumber: this._orderNumber,
        userId,
        assignedById,
      }),
    );
  }

  changeStatus(newStatus: ServiceOrderStatus, actorId: string, reason?: string): void {
    if (!canTransition(this._status, newStatus)) {
      throw new Error(
        `Invalid status transition: ${this._status} → ${newStatus}`,
      );
    }

    const oldStatus = this._status;
    this._status = newStatus;

    if (newStatus === ServiceOrderStatus.IN_PROGRESS && !this._startedAt) {
      this._startedAt = new Date();
    }
    if (newStatus === ServiceOrderStatus.COMPLETED) {
      this._completedAt = new Date();
    }
    if (newStatus === ServiceOrderStatus.CANCELLED) {
      this._cancelledAt = new Date();
      this._cancelReason = reason;
    }

    this.touch();

    this.addDomainEvent(
      new ServiceOrderStatusChangedEvent(this._tenantId, this._id, {
        orderNumber: this._orderNumber,
        fromStatus: oldStatus,
        toStatus: newStatus,
        actorId,
        reason,
      }),
    );
  }

  cancel(reason: string, actorId: string): void {
    if (this._status === ServiceOrderStatus.COMPLETED) {
      throw new Error('Cannot cancel a completed service order');
    }
    if (this._status === ServiceOrderStatus.CANCELLED) {
      throw new Error('Service order is already cancelled');
    }
    this.changeStatus(ServiceOrderStatus.CANCELLED, actorId, reason);
  }

  complete(actorId: string): void {
    if (this._status !== ServiceOrderStatus.IN_PROGRESS) {
      throw new Error('Only in-progress orders can be completed');
    }
    this.changeStatus(ServiceOrderStatus.COMPLETED, actorId);
  }

  reopen(actorId: string): void {
    if (
      this._status !== ServiceOrderStatus.COMPLETED &&
      this._status !== ServiceOrderStatus.CANCELLED
    ) {
      throw new Error('Only completed or cancelled orders can be reopened');
    }
    const oldStatus = this._status;
    this._status = ServiceOrderStatus.REOPENED;
    this._completedAt = undefined;
    this._cancelledAt = undefined;
    this._cancelReason = undefined;
    this.touch();

    this.addDomainEvent(
      new ServiceOrderStatusChangedEvent(this._tenantId, this._id, {
        orderNumber: this._orderNumber,
        fromStatus: oldStatus,
        toStatus: ServiceOrderStatus.REOPENED,
        actorId,
      }),
    );
  }

  reschedule(scheduledAt: Date, actorId: string): void {
    if (
      this._status === ServiceOrderStatus.COMPLETED ||
      this._status === ServiceOrderStatus.CANCELLED
    ) {
      throw new Error('Cannot reschedule a terminal service order');
    }
    this._scheduledAt = scheduledAt;
    this.touch();
  }

  markSlaBreached(): void {
    if (!this._slaBreached) {
      this._slaBreached = true;
      this.touch();
    }
  }

  update(data: {
    title?: string;
    description?: string;
    priority?: PriorityLevel;
    scheduledAt?: Date;
    dueDate?: Date;
    address?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): void {
    if (
      this._status === ServiceOrderStatus.COMPLETED ||
      this._status === ServiceOrderStatus.CANCELLED
    ) {
      throw new Error('Cannot update a terminal service order');
    }

    if (data.title !== undefined) this._title = data.title;
    if (data.description !== undefined) this._description = data.description;
    if (data.priority !== undefined) this._priority = data.priority;
    if (data.scheduledAt !== undefined) this._scheduledAt = data.scheduledAt;
    if (data.dueDate !== undefined) this._dueDate = data.dueDate;
    if (data.address !== undefined) this._address = data.address;
    if (data.metadata !== undefined) this._metadata = { ...this._metadata, ...data.metadata };

    this.touch();
  }
}
