import { BaseAggregate } from '@shared/domain/base-aggregate';
import { BusinessRuleException } from '@shared/exceptions/business-rule.exception';

export enum ClientType { COMPANY = 'COMPANY', INDIVIDUAL = 'INDIVIDUAL' }
export enum ClientStatus { ACTIVE = 'ACTIVE', INACTIVE = 'INACTIVE', BLOCKED = 'BLOCKED' }

export class ClientEntity extends BaseAggregate {
  tenantId: string;
  name: string;
  tradeName?: string;
  document?: string;
  type: ClientType;
  email?: string;
  phone?: string;
  status: ClientStatus;
  notes?: string;

  constructor(props: { id?: string; tenantId: string; name: string; tradeName?: string; document?: string; type?: ClientType; email?: string; phone?: string; status?: ClientStatus; notes?: string }) {
    super({ id: props.id });
    this.tenantId = props.tenantId;
    this.name = props.name;
    this.tradeName = props.tradeName;
    this.document = props.document;
    this.type = props.type ?? ClientType.COMPANY;
    this.email = props.email;
    this.phone = props.phone;
    this.status = props.status ?? ClientStatus.ACTIVE;
    this.notes = props.notes;
  }

  update(data: Partial<{ name: string; tradeName: string; email: string; phone: string; notes: string }>) {
    Object.assign(this, data);
    this.touch();
  }

  activate() {
    if (this.status === ClientStatus.ACTIVE) throw new BusinessRuleException('Client is already active');
    this.status = ClientStatus.ACTIVE;
    this.touch();
  }

  deactivate() {
    if (this.status === ClientStatus.INACTIVE) throw new BusinessRuleException('Client is already inactive');
    this.status = ClientStatus.INACTIVE;
    this.touch();
  }
}