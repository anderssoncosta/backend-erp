import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { STOCK_ITEM_REPOSITORY, IStockItemRepository } from '../../../domain/repositories/stock-item.repository.interface';
import { StockAggregate } from '../../../domain/aggregates/stock.aggregate';
import { StockItem } from '../../../domain/entities/stock-item.entity';
import { TransferStockDto } from './transfer-stock.dto';

@Injectable()
export class TransferStockUseCase {
  constructor(
    @Inject(STOCK_ITEM_REPOSITORY) private readonly repo: IStockItemRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: TransferStockDto, tenantId: string, actorId: string) {
    if (dto.fromBranchId === dto.toBranchId) {
      throw new ConflictException('Source and destination branches must differ');
    }

    return this.prisma.$transaction(async () => {
      const count = await this.prisma.stockTransfer.count({ where: { tenantId } });
      const year = new Date().getFullYear().toString().slice(-2);
      const transferNumber = `TRF-${year}-${String(count + 1).padStart(5, '0')}`;

      const transfer = await this.prisma.stockTransfer.create({
        data: {
          tenantId, transferNumber,
          fromBranchId: dto.fromBranchId, toBranchId: dto.toBranchId,
          status: 'RECEIVED', requestedById: actorId,
          approvedById: actorId, completedById: actorId,
          approvedAt: new Date(), completedAt: new Date(),
          notes: dto.notes,
          items: {
            create: dto.items.map((item) => ({
              materialId: item.materialId,
              requestedQty: item.quantity, approvedQty: item.quantity,
              sentQty: item.quantity, receivedQty: item.quantity, unitCost: 0,
            })),
          },
        },
      });

      for (const item of dto.items) {
        const source = await this.repo.findByMaterialAndBranch(item.materialId, dto.fromBranchId, tenantId);
        if (!source) throw new NotFoundException(`Material ${item.materialId} not found in source branch`);

        const sourceAgg = new StockAggregate(source);
        sourceAgg.processExit(item.quantity, 'TRANSFER_OUT', {
          type: 'TRANSFER', id: transfer.id, performedById: actorId,
        });

        let dest = await this.repo.findByMaterialAndBranch(item.materialId, dto.toBranchId, tenantId);
        if (!dest) {
          dest = await this.repo.save(new StockItem({
            tenantId, branchId: dto.toBranchId, materialId: item.materialId,
            quantity: 0, reservedQty: 0, availableQty: 0, averageCost: source.averageCost,
          }));
        }

        const destAgg = new StockAggregate(dest);
        destAgg.processEntry(item.quantity, source.averageCost, {
          type: 'TRANSFER', id: transfer.id, performedById: actorId,
        });

        const [srcMovements, destMovements] = [
          sourceAgg.collectPendingMovements(),
          destAgg.collectPendingMovements(),
        ];

        await Promise.all([
          this.repo.update(sourceAgg.stockItem),
          this.repo.update(destAgg.stockItem),
          this.prisma.stockMovement.create({ data: srcMovements[0] }),
          this.prisma.stockMovement.create({ data: destMovements[0] }),
        ]);

        for (const evt of [...sourceAgg.collectDomainEvents(), ...destAgg.collectDomainEvents()]) {
          this.eventEmitter.emit(evt.eventType, evt);
        }
      }

      return { transferId: transfer.id, transferNumber };
    });
  }
}
