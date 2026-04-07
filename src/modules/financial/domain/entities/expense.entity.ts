import { BaseAggregate } from '@shared/domain/base-aggregate';
import { BusinessRuleException } from '@shared/exceptions/business-rule.exception';
import { ExpenseApprovedEvent } from '../events/expense-approved.event';

export enum ExpenseStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
}

export class ExpenseEntity extends BaseAggregate {
  tenantId: string;
  description: string;
  amount: number;
  category: string;
  costCenterId?: string;
  /** maps to `requestedById` in DB */
  requestedById: string;
  status: ExpenseStatus;
  approvedById?: string;
  rejectionReason?: string;
  paidAt?: Date;
  receiptUrl?: string;
  /** maps to `competenceDate` in DB */
  competenceDate: Date;

  constructor(props: {
    id?: string;
    tenantId: string;
    description: string;
    amount: number;
    category: string;
    costCenterId?: string;
    requestedById: string;
    status?: ExpenseStatus;
    approvedById?: string;
    rejectionReason?: string;
    paidAt?: Date;
    receiptUrl?: string;
    competenceDate: Date;
  }) {
    super({ id: props.id });
    this.tenantId = props.tenantId;
    this.description = props.description;
    this.amount = props.amount;
    this.category = props.category;
    this.costCenterId = props.costCenterId;
    this.requestedById = props.requestedById;
    this.status = props.status ?? ExpenseStatus.PENDING;
    this.approvedById = props.approvedById;
    this.rejectionReason = props.rejectionReason;
    this.paidAt = props.paidAt;
    this.receiptUrl = props.receiptUrl;
    this.competenceDate = props.competenceDate;
  }

  approve(approverId: string) {
    if (this.status !== ExpenseStatus.PENDING) {
      throw new BusinessRuleException(`Cannot approve expense in status ${this.status}`);
    }
    this.status = ExpenseStatus.APPROVED;
    this.approvedById = approverId;
    this.touch();
    this.addDomainEvent(
      new ExpenseApprovedEvent({
        tenantId: this.tenantId,
        expenseId: this.id,
        amount: this.amount,
        approvedBy: approverId,
      }),
    );
  }

  reject(reason: string) {
    if (this.status !== ExpenseStatus.PENDING) {
      throw new BusinessRuleException(`Cannot reject expense in status ${this.status}`);
    }
    this.status = ExpenseStatus.REJECTED;
    this.rejectionReason = reason;
    this.touch();
  }

  pay() {
    if (this.status !== ExpenseStatus.APPROVED) {
      throw new BusinessRuleException('Only approved expenses can be paid');
    }
    this.status = ExpenseStatus.PAID;
    this.paidAt = new Date();
    this.touch();
  }
}
