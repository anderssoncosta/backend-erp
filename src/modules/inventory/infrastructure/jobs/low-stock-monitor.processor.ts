import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { QUEUE_NAMES } from '@shared/constants/queue-names.constant';

@Processor(QUEUE_NAMES.INVENTORY)
export class LowStockMonitorProcessor {
  private readonly logger = new Logger(LowStockMonitorProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Process('check-low-stock')
  async handle(job: Job<{ tenantId: string }>): Promise<void> {
    const { tenantId } = job.data;

    const lowItems = await this.prisma.$queryRaw<
      Array<{ stockItemId: string; materialId: string; availableQty: number; minStock: number }>
    >`
      SELECT si.id as "stockItemId", si.material_id as "materialId",
             si.available_qty::float as "availableQty", m.min_stock::float as "minStock"
      FROM stock_items si
      JOIN materials m ON m.id = si.material_id
      WHERE si.tenant_id = ${tenantId}::uuid
        AND m.min_stock IS NOT NULL
        AND si.available_qty <= m.min_stock
        AND si.is_active = true
    `;

    for (const item of lowItems) {
      this.eventEmitter.emit('inventory.low_stock', {
        tenantId, materialId: item.materialId, stockItemId: item.stockItemId,
        currentQty: item.availableQty, minStock: item.minStock,
      });
    }

    this.logger.debug(`Low-stock check: ${lowItems.length} items for tenant ${tenantId}`);
  }
}
