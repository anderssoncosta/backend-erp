import { BaseAggregate } from '@shared/domain/base-aggregate';
import { StockItem } from '../entities/stock-item.entity';
import { StockMovedEvent } from '../events/stock-moved.event';
import { StockLowEvent } from '../events/stock-low.event';

export interface StockMovementRecord {
  tenantId: string;
  branchId: string;
  materialId: string;
  type: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceType?: string;
  referenceId?: string;
  batchNumber?: string;
  notes?: string;
  performedById: string;
}

export class StockAggregate extends BaseAggregate {
  private _stockItem: StockItem;
  private _pendingMovements: StockMovementRecord[] = [];
  private readonly _minStock: number;

  constructor(stockItem: StockItem, minStock = 0) {
    super({ id: stockItem.id });
    this._stockItem = stockItem;
    this._minStock = minStock;
  }

  get stockItem(): StockItem { return this._stockItem; }

  processEntry(
    qty: number,
    unitCost: number,
    ref: { type: string; id: string; performedById: string; batchNumber?: string; notes?: string },
  ): StockMovementRecord {
    const balanceBefore = this._stockItem.quantity;
    this._stockItem.addStock(qty, unitCost);
    const balanceAfter = this._stockItem.quantity;

    const movement: StockMovementRecord = {
      tenantId: this._stockItem.tenantId,
      branchId: this._stockItem.branchId,
      materialId: this._stockItem.materialId,
      type: 'ENTRY',
      quantity: qty,
      unitCost,
      totalCost: qty * unitCost,
      balanceBefore,
      balanceAfter,
      referenceType: ref.type,
      referenceId: ref.id,
      batchNumber: ref.batchNumber,
      notes: ref.notes,
      performedById: ref.performedById,
    };

    this._pendingMovements.push(movement);
    this.addDomainEvent(new StockMovedEvent(this._stockItem.tenantId, this._stockItem.id, {
      materialId: this._stockItem.materialId, direction: 'IN', quantity: qty, balanceAfter,
    }));

    return movement;
  }

  processExit(
    qty: number,
    movementType: string,
    ref: { type: string; id: string; performedById: string; notes?: string },
  ): StockMovementRecord {
    const balanceBefore = this._stockItem.quantity;
    this._stockItem.removeStock(qty);
    const balanceAfter = this._stockItem.quantity;

    const movement: StockMovementRecord = {
      tenantId: this._stockItem.tenantId,
      branchId: this._stockItem.branchId,
      materialId: this._stockItem.materialId,
      type: movementType,
      quantity: qty,
      unitCost: this._stockItem.averageCost,
      totalCost: qty * this._stockItem.averageCost,
      balanceBefore,
      balanceAfter,
      referenceType: ref.type,
      referenceId: ref.id,
      notes: ref.notes,
      performedById: ref.performedById,
    };

    this._pendingMovements.push(movement);
    this.addDomainEvent(new StockMovedEvent(this._stockItem.tenantId, this._stockItem.id, {
      materialId: this._stockItem.materialId, direction: 'OUT', quantity: qty, balanceAfter,
    }));

    if (this._stockItem.isLowStock(this._minStock)) {
      this.addDomainEvent(new StockLowEvent(this._stockItem.tenantId, this._stockItem.id, {
        materialId: this._stockItem.materialId,
        currentQty: balanceAfter,
        minStock: this._minStock,
      }));
    }

    return movement;
  }

  collectPendingMovements(): StockMovementRecord[] {
    const movements = [...this._pendingMovements];
    this._pendingMovements = [];
    return movements;
  }
}
