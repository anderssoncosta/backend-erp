import { BaseEntity } from '@shared/domain/base-entity';

export class CostCenterEntity extends BaseEntity {
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;

  constructor(props: {
    id?: string;
    tenantId: string;
    code: string;
    name: string;
    description?: string;
    parentId?: string;
    isActive?: boolean;
  }) {
    super({ id: props.id });
    this.tenantId = props.tenantId;
    this.code = props.code;
    this.name = props.name;
    this.description = props.description;
    this.parentId = props.parentId;
    this.isActive = props.isActive ?? true;
  }

  update(props: Partial<{ name: string; description: string; isActive: boolean }>) {
    if (props.name !== undefined) this.name = props.name;
    if (props.description !== undefined) this.description = props.description;
    if (props.isActive !== undefined) this.isActive = props.isActive;
    this.touch();
  }
}
