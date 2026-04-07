import { StockItem } from '../entities/stock-item.entity';

export const STOCK_ITEM_REPOSITORY = 'STOCK_ITEM_REPOSITORY';

export interface IStockItemRepository {
  findById(id: string, tenantId: string): Promise<StockItem | null>;
  findByMaterialAndBranch(materialId: string, branchId: string, tenantId: string): Promise<StockItem | null>;
  findByTenantAndBranch(tenantId: string, branchId?: string): Promise<StockItem[]>;
  save(entity: StockItem): Promise<StockItem>;
  update(entity: StockItem): Promise<StockItem>;
}
