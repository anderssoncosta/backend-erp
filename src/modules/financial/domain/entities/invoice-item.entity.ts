import { randomUUID } from 'crypto';

export class InvoiceItemEntity {
  readonly id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  serviceOrderId?: string;

  constructor(props: {
    id?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    serviceOrderId?: string;
  }) {
    this.id = props.id ?? randomUUID();
    this.description = props.description;
    this.quantity = props.quantity;
    this.unitPrice = props.unitPrice;
    this.totalPrice = props.quantity * props.unitPrice;
    this.serviceOrderId = props.serviceOrderId;
  }

  update(props: Partial<{ description: string; quantity: number; unitPrice: number }>) {
    if (props.description !== undefined) this.description = props.description;
    if (props.quantity !== undefined) this.quantity = props.quantity;
    if (props.unitPrice !== undefined) this.unitPrice = props.unitPrice;
    this.totalPrice = this.quantity * this.unitPrice;
  }
}
