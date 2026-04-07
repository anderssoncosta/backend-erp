import { BaseAggregate } from '@shared/domain/base-aggregate';
import { BusinessRuleException } from '@shared/exceptions/business-rule.exception';
import { InvoiceStatus, canTransitionInvoice } from '../value-objects/invoice-status.vo';
import { InvoiceItemEntity } from './invoice-item.entity';
import { InvoiceIssuedEvent } from '../events/invoice-issued.event';
import { InvoicePaidEvent } from '../events/invoice-paid.event';

export class InvoiceEntity extends BaseAggregate {
  tenantId: string;
  /** maps to `invoiceNumber` in DB */
  invoiceNumber: string;
  clientId?: string;
  costCenterId?: string;
  status: InvoiceStatus;
  dueDate: Date;
  totalAmount: number;
  paidAmount: number;
  notes?: string;
  items: InvoiceItemEntity[];

  private constructor(props: {
    id?: string;
    tenantId: string;
    invoiceNumber: string;
    clientId?: string;
    costCenterId?: string;
    status: InvoiceStatus;
    dueDate: Date;
    totalAmount: number;
    paidAmount: number;
    notes?: string;
    items: InvoiceItemEntity[];
  }) {
    super({ id: props.id });
    this.tenantId = props.tenantId;
    this.invoiceNumber = props.invoiceNumber;
    this.clientId = props.clientId;
    this.costCenterId = props.costCenterId;
    this.status = props.status;
    this.dueDate = props.dueDate;
    this.totalAmount = props.totalAmount;
    this.paidAmount = props.paidAmount;
    this.notes = props.notes;
    this.items = props.items;
  }

  static create(props: {
    tenantId: string;
    invoiceNumber: string;
    clientId?: string;
    costCenterId?: string;
    dueDate: Date;
    notes?: string;
    items: Array<{ description: string; quantity: number; unitPrice: number; serviceOrderId?: string }>;
  }): InvoiceEntity {
    const items = props.items.map((i) => new InvoiceItemEntity(i));
    const totalAmount = items.reduce((sum, i) => sum + i.totalPrice, 0);
    return new InvoiceEntity({
      tenantId: props.tenantId,
      invoiceNumber: props.invoiceNumber,
      clientId: props.clientId,
      costCenterId: props.costCenterId,
      status: InvoiceStatus.DRAFT,
      dueDate: props.dueDate,
      totalAmount,
      paidAmount: 0,
      notes: props.notes,
      items,
    });
  }

  static reconstitute(props: {
    id: string;
    tenantId: string;
    invoiceNumber: string;
    clientId?: string;
    costCenterId?: string;
    status: InvoiceStatus;
    dueDate: Date;
    totalAmount: number;
    paidAmount: number;
    notes?: string;
    items: InvoiceItemEntity[];
  }): InvoiceEntity {
    return new InvoiceEntity(props);
  }

  addItem(item: { description: string; quantity: number; unitPrice: number; serviceOrderId?: string }) {
    if (this.status !== InvoiceStatus.DRAFT) {
      throw new BusinessRuleException('Items can only be added to DRAFT invoices');
    }
    this.items.push(new InvoiceItemEntity(item));
    this.recalculateTotal();
  }

  removeItem(itemId: string) {
    if (this.status !== InvoiceStatus.DRAFT) {
      throw new BusinessRuleException('Items can only be removed from DRAFT invoices');
    }
    this.items = this.items.filter((i) => i.id !== itemId);
    this.recalculateTotal();
  }

  issue() {
    if (!canTransitionInvoice(this.status, InvoiceStatus.ISSUED)) {
      throw new BusinessRuleException(`Cannot issue invoice in status ${this.status}`);
    }
    if (this.items.length === 0) {
      throw new BusinessRuleException('Cannot issue an invoice with no items');
    }
    this.status = InvoiceStatus.ISSUED;
    this.touch();
    this.addDomainEvent(
      new InvoiceIssuedEvent({
        tenantId: this.tenantId,
        invoiceId: this.id,
        number: this.invoiceNumber,
        totalAmount: this.totalAmount,
      }),
    );
  }

  registerPayment(amount: number) {
    if (this.status === InvoiceStatus.CANCELLED) {
      throw new BusinessRuleException('Cannot register payment on a cancelled invoice');
    }
    if (this.status === InvoiceStatus.PAID) {
      throw new BusinessRuleException('Invoice is already paid');
    }
    this.paidAmount += amount;
    if (this.paidAmount >= this.totalAmount) {
      this.status = InvoiceStatus.PAID;
      this.addDomainEvent(
        new InvoicePaidEvent({
          tenantId: this.tenantId,
          invoiceId: this.id,
          number: this.invoiceNumber,
          totalAmount: this.totalAmount,
        }),
      );
    } else {
      this.status = InvoiceStatus.PARTIALLY_PAID;
    }
    this.touch();
  }

  markOverdue() {
    if (canTransitionInvoice(this.status, InvoiceStatus.OVERDUE)) {
      this.status = InvoiceStatus.OVERDUE;
      this.touch();
    }
  }

  cancel(reason?: string) {
    if (!canTransitionInvoice(this.status, InvoiceStatus.CANCELLED)) {
      throw new BusinessRuleException(`Cannot cancel invoice in status ${this.status}`);
    }
    this.status = InvoiceStatus.CANCELLED;
    if (reason) this.notes = reason;
    this.touch();
  }

  private recalculateTotal() {
    this.totalAmount = this.items.reduce((sum, i) => sum + i.totalPrice, 0);
  }
}
