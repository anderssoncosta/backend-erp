import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { IStockItemRepository } from '../../domain/repositories/stock-item.repository.interface';
import { StockItem } from '../../domain/entities/stock-item.entity';

@Injectable()
export class StockItemPrismaRepository implements IStockItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tenantId: string): Promise<StockItem | null> {
    const row = await this.prisma.stockItem.findFirst({ where: { id, tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findByMaterialAndBranch(materialId: string, branchId: string, tenantId: string): Promise<StockItem | null> {
    const row = await this.prisma.stockItem.findFirst({
      where: { materialId, branchId, tenantId },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByTenantAndBranch(tenantId: string, branchId?: string): Promise<StockItem[]> {
    const rows = await this.prisma.stockItem.findMany({
      where: { tenantId, ...(branchId && { branchId }), isActive: true },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async save(entity: StockItem): Promise<StockItem> {
    const row = await this.prisma.stockItem.create({
      data: {
        id: entity.id,
        tenantId: entity.tenantId,
        branchId: entity.branchId,
        materialId: entity.materialId,
        quantity: entity.quantity,
        reservedQty: entity.reservedQty,
        availableQty: entity.availableQty,
        averageCost: entity.averageCost,
        location: entity.location ?? null,
        isActive: true,
      },
    });
    return this.toDomain(row);
  }

  async update(entity: StockItem): Promise<StockItem> {
    const row = await this.prisma.stockItem.update({
      where: { id: entity.id },
      data: {
        quantity: entity.quantity,
        reservedQty: entity.reservedQty,
        availableQty: entity.availableQty,
        averageCost: entity.averageCost,
        updatedAt: entity.updatedAt,
      },
    });
    return this.toDomain(row);
  }

  private toDomain(row: {
    id: string; tenantId: string; branchId: string; materialId: string;
    quantity: unknown; reservedQty: unknown; availableQty: unknown;
    averageCost: unknown; location: string | null; createdAt: Date; updatedAt: Date;
  }): StockItem {
    return new StockItem({
      id: row.id, tenantId: row.tenantId, branchId: row.branchId, materialId: row.materialId,
      quantity: Number(row.quantity), reservedQty: Number(row.reservedQty),
      availableQty: Number(row.availableQty), averageCost: Number(row.averageCost),
      location: row.location ?? undefined, createdAt: row.createdAt, updatedAt: row.updatedAt,
    });
  }
}
