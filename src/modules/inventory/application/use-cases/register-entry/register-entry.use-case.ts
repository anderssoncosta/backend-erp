import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import {
  STOCK_ITEM_REPOSITORY,
  IStockItemRepository,
} from '../../../domain/repositories/stock-item.repository.interface';
import { StockAggregate } from '../../../domain/aggregates/stock.aggregate';
import { StockItem } from '../../../domain/entities/stock-item.entity';
import { RegisterEntryDto } from './register-entry.dto';

@Injectable()
export class RegisterEntryUseCase {
  constructor(
    @Inject(STOCK_ITEM_REPOSITORY) private readonly stockItemRepository: IStockItemRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    dto: RegisterEntryDto,
    tenantId: string,
    actorId: string,
  ): Promise<{ movementId: string; newBalance: number }> {
    return this.prisma.$transaction(async () => {
      let stockItem = await this.stockItemRepository.findByMaterialAndBranch(
        dto.materialId, dto.branchId, tenantId,
      );

      if (!stockItem) {
        stockItem = await this.stockItemRepository.save(
          new StockItem({
            tenantId, branchId: dto.branchId, materialId: dto.materialId,
            quantity: 0, reservedQty: 0, availableQty: 0, averageCost: dto.unitCost,
          }),
        );
      }

      const material = await this.prisma.material.findFirst({
        where: { id: dto.materialId, tenantId },
        select: { minStock: true },
      });

      const aggregate = new StockAggregate(stockItem, Number(material?.minStock ?? 0));

      aggregate.processEntry(dto.quantity, dto.unitCost, {
        type: dto.referenceType ?? 'MANUAL',
        id: dto.referenceId ?? actorId,
        performedById: actorId,
        batchNumber: dto.batchNumber,
        notes: dto.notes,
      });

      await this.stockItemRepository.update(aggregate.stockItem);

      const movements = aggregate.collectPendingMovements();
      const savedMovement = await this.prisma.stockMovement.create({ data: movements[0] });

      for (const event of aggregate.collectDomainEvents()) {
        this.eventEmitter.emit(event.eventType, event);
      }

      return { movementId: savedMovement.id, newBalance: aggregate.stockItem.quantity };
    });
  }
}
