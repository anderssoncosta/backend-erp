import { BaseEntity } from '@shared/domain/base-entity';

export interface TenantProps {
  id?: string;
  name: string;
  slug: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  plan?: string;
  status?: string;
  logoUrl?: string;
  settings?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Tenant extends BaseEntity {
  private _name: string;
  private _slug: string;
  private _cnpj: string | undefined;
  private _email: string | undefined;
  private _phone: string | undefined;
  private _plan: string;
  private _status: string;
  private _logoUrl: string | undefined;
  private _settings: Record<string, unknown>;

  constructor(props: TenantProps) {
    super({ id: props.id, createdAt: props.createdAt, updatedAt: props.updatedAt });
    this._name = props.name;
    this._slug = props.slug;
    this._cnpj = props.cnpj;
    this._email = props.email;
    this._phone = props.phone;
    this._plan = props.plan ?? 'STARTER';
    this._status = props.status ?? 'ACTIVE';
    this._logoUrl = props.logoUrl;
    this._settings = props.settings ?? {};
  }

  get name(): string { return this._name; }
  get slug(): string { return this._slug; }
  get cnpj(): string | undefined { return this._cnpj; }
  get email(): string | undefined { return this._email; }
  get phone(): string | undefined { return this._phone; }
  get plan(): string { return this._plan; }
  get status(): string { return this._status; }
  get logoUrl(): string | undefined { return this._logoUrl; }
  get settings(): Record<string, unknown> { return this._settings; }

  activate(): void { this._status = 'ACTIVE'; this.touch(); }
  deactivate(): void { this._status = 'INACTIVE'; this.touch(); }

  updateSettings(settings: Record<string, unknown>): void {
    this._settings = { ...this._settings, ...settings };
    this.touch();
  }
}
