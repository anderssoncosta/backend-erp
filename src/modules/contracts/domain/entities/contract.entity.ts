import { BaseAggregate } from '@shared/domain/base-aggregate';
import { BusinessRuleException } from '@shared/exceptions/business-rule.exception';
import { ContractStatus, canTransitionContract } from '../value-objects/contract-status.vo';

export class ContractEntity extends BaseAggregate {
  tenantId: string; clientId: string; number: string; title: string; type: string;
  status: ContractStatus; startDate: Date; endDate?: Date; value?: number;
  slaPolicy?: Record<string, unknown>; terms?: string; notes?: string;

  constructor(props: { id?: string; tenantId: string; clientId: string; number: string; title: string; type: string; status?: ContractStatus; startDate: Date; endDate?: Date; value?: number; slaPolicy?: Record<string, unknown>; terms?: string; notes?: string }) {
    super({ id: props.id });
    Object.assign(this, props);
    this.status = props.status ?? ContractStatus.DRAFT;
  }

  activate() {
    if (!canTransitionContract(this.status, ContractStatus.ACTIVE)) throw new BusinessRuleException('Cannot activate contract in status ' + this.status);
    this.status = ContractStatus.ACTIVE; this.touch();
  }

  suspend(reason?: string) {
    if (!canTransitionContract(this.status, ContractStatus.SUSPENDED)) throw new BusinessRuleException('Cannot suspend contract in status ' + this.status);
    this.status = ContractStatus.SUSPENDED;
    if (reason) this.notes = reason;
    this.touch();
  }

  cancel(reason?: string) {
    if (!canTransitionContract(this.status, ContractStatus.CANCELLED)) throw new BusinessRuleException('Cannot cancel contract in status ' + this.status);
    this.status = ContractStatus.CANCELLED;
    if (reason) this.notes = reason;
    this.touch();
  }

  renew(newEndDate: Date) {
    if (this.status === ContractStatus.CANCELLED) throw new BusinessRuleException('Cannot renew a cancelled contract');
    this.endDate = newEndDate;
    if (this.status === ContractStatus.EXPIRED) this.status = ContractStatus.ACTIVE;
    this.touch();
  }

  isExpired(): boolean {
    return this.endDate ? new Date() > this.endDate : false;
  }
}