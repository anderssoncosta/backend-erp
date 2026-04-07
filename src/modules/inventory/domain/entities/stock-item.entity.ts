import { BaseEntity } from '@shared/domain/base-entity';

export interface StockItemProps {
  id?: string;
  tenantId: string;
  branchId: string;
  materialId: string;
  quantity: number;
  reservedQty: number;
  availableQty: number;
  averageCost: number;
  location?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class StockItem extends BaseEntity {
  private _tenantId: string;
  private _branchId: string;
  private _materialId: string;
  private _quantity: number;
  private _reservedQty: number;
  private _availableQty: number;
  private _averageCost: number;
  private _location: string | undefined;

  constructor(props: StockItemProps) {
    super({ id: props.id, createdAt: props.createdAt, updatedAt: props.updatedAt });
    this._tenantId = props.tenantId;
    this._branchId = props.branchId;
    this._materialId = props.materialId;
    this._quantity = props.quantity;
    this._reservedQty = props.reservedQty;
    this._availableQty = props.availableQty;
    this._averageCost = props.averageCost;
    this._location = props.location;
  }

  get tenantId(): string { return this._tenantId; }
  get branchId(): string { return this._branchId; }
  get materialId(): string { return this._materialId; }
  get quantity(): number { return this._quantity; }
  get reservedQty(): number { return this._reservedQty; }
  get availableQty(): number { return this._availableQty; }
  get averageCost(): number { return this._averageCost; }
  get location(): string | undefined { return this._location; }

  addStock(qty: number, unitCost: number): void {
    if (qty <= 0) throw new Error('Quantity must be positive');
    const totalCurrentValue = this._quantity * this._averageCost;
    const incomingValue = qty * unitCost;
    const newQuantity = this._quantity + qty;
    this._averageCost = newQuantity > 0
      ? (totalCurrentValue + incomingValue) / newQuantity
      : unitCost;
    this._quantity = newQuantity;
    this._availableQty = this._quantity - this._reservedQty;
    this.touch();
  }

  removeStock(qty: number): void {
    if (qty <= 0) throw new Error('Quantity must be positive');
    if (qty > this._availableQty) {
      throw new Error(
        `Insufficient stock. Available: ${this._availableQty}, Requested: ${qty}`,
      );
    }
    this._quantity -= qty;
    this._availableQty = this._quantity - this._reservedQty;
    this.touch();
  }

  reserveStock(qty: number): void {
    if (qty > this._availableQty) {
      throw new Error(`Cannot reserve ${qty}. Available: ${this._availableQty}`);
    }
    this._reservedQty += qty;
    this._availableQty = this._quantity - this._reservedQty;
    this.touch();
  }

  releaseReservation(qty: number): void {
    this._reservedQty = Math.max(0, this._reservedQty - qty);
    this._availableQty = this._quantity - this._reservedQty;
    this.touch();
  }

  adjustTo(newQuantity: number): number {
    if (newQuantity < 0) throw new Error('Stock quantity cannot be negative');
    const difference = newQuantity - this._quantity;
    this._quantity = newQuantity;
    this._availableQty = Math.max(0, this._quantity - this._reservedQty);
    this.touch();
    return difference;
  }

  isLowStock(minStock: number): boolean {
    return this._availableQty <= minStock;
  }
}
