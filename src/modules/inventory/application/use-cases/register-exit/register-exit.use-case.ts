import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { STOCK_ITEM_REPOSITORY, IStockItemRepository } from '../../../domain/repositories/stock-item.repository.interface';
import { StockAggregate } from '../../../domain/aggregates/stock.aggregate';
import { RegisterExitDto } from './register-exit.dto';

@Injectable()
export class RegisterExitUseCase {
  constructor(
    @Inject(STOCK_ITEM_REPOSITORY) private readonly repo: IStockItemRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: RegisterExitDto, tenantId: string, actorId: string) {
    return this.prisma.$transaction(async () => {
      const stockItem = await this.repo.findByMaterialAndBranch(dto.materialId, dto.branchId, tenantId);
      if (!stockItem) throw new NotFoundException('Stock item not found');

      const aggregate = new StockAggregate(stockItem);
      aggregate.processExit(dto.quantity, dto.type ?? 'EXIT', {
        type: dto.referenceType ?? 'MANUAL',
        id: dto.referenceId ?? actorId,
        performedById: actorId,
        notes: dto.notes,
      });

      await this.repo.update(aggregate.stockItem);

      const movements = aggregate.collectPendingMovements();
      const saved = await this.prisma.stockMovement.create({ data: movements[0] });

      for (const event of aggregate.collectDomainEvents()) {
        this.eventEmitter.emit(event.eventType, event);
      }

      return { movementId: saved.id, newBalance: aggregate.stockItem.quantity };
    });
  }
}
