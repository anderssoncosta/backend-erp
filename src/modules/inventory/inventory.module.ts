import { Module } from '@nestjs/common';
import { STOCK_ITEM_REPOSITORY } from './domain/repositories/stock-item.repository.interface';
import { StockItemPrismaRepository } from './infrastructure/repositories/stock-item.prisma.repository';
import { LowStockMonitorProcessor } from './infrastructure/jobs/low-stock-monitor.processor';
import { RegisterEntryUseCase } from './application/use-cases/register-entry/register-entry.use-case';
import { RegisterExitUseCase } from './application/use-cases/register-exit/register-exit.use-case';
import { TransferStockUseCase } from './application/use-cases/transfer-stock/transfer-stock.use-case';
import { InventoryController } from './presentation/controllers/inventory.controller';

@Module({
  controllers: [InventoryController],
  providers: [
    { provide: STOCK_ITEM_REPOSITORY, useClass: StockItemPrismaRepository },
    RegisterEntryUseCase,
    RegisterExitUseCase,
    TransferStockUseCase,
    LowStockMonitorProcessor,
  ],
  exports: [RegisterEntryUseCase, RegisterExitUseCase, TransferStockUseCase],
})
export class InventoryModule {}
