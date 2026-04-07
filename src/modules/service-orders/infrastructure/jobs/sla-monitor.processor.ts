import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Inject, Logger } from '@nestjs/common';
import {
  IServiceOrderRepository,
  SERVICE_ORDER_REPOSITORY,
} from '../../domain/repositories/service-order.repository.interface';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { QUEUE_NAMES } from '@shared/constants/queue-names.constant';

@Processor(QUEUE_NAMES.SERVICE_ORDERS)
export class SlaMonitorProcessor {
  private readonly logger = new Logger(SlaMonitorProcessor.name);

  constructor(
    @Inject(SERVICE_ORDER_REPOSITORY)
    private readonly repository: IServiceOrderRepository,
    private readonly prisma: PrismaService,
  ) {}

  @Process('check-sla')
  async handleSlaCheck(job: Job<{ tenantId: string }>): Promise<void> {
    const { tenantId } = job.data;
    this.logger.debug(`Checking SLA for tenant: ${tenantId}`);

    const breachingOrders = await this.repository.findBreachingSla(tenantId);

    if (breachingOrders.length === 0) return;

    this.logger.warn(
      `Found ${breachingOrders.length} SLA-breaching orders for tenant: ${tenantId}`,
    );

    for (const order of breachingOrders) {
      await this.prisma.serviceOrder.update({
        where: { id: order.id },
        data: { slaBreached: true },
      });

      this.logger.warn(
        `SLA breached for order: ${order.orderNumber} (${order.id})`,
      );
    }
  }
}
