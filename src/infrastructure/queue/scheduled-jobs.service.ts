import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { QUEUE_NAMES } from '@shared/constants/queue-names.constant';

@Injectable()
export class ScheduledJobsService {
  private readonly logger = new Logger(ScheduledJobsService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.SERVICE_ORDERS)
    private readonly soQueue: Queue,
    @InjectQueue(QUEUE_NAMES.INVENTORY)
    private readonly inventoryQueue: Queue,
    @InjectQueue(QUEUE_NAMES.FINANCIAL)
    private readonly financialQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  @Cron('*/15 * * * *')
  async scheduleSlaMonitor(): Promise<void> {
    const tenants = await this.prisma.tenant.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      select: { id: true },
    });

    for (const tenant of tenants) {
      await this.soQueue.add(
        'check-sla',
        { tenantId: tenant.id },
        { jobId: `sla-${tenant.id}-${Math.floor(Date.now() / 1000)}` },
      );
    }

    this.logger.debug(`SLA monitor scheduled for ${tenants.length} tenants`);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async scheduleLowStockCheck(): Promise<void> {
    const tenants = await this.prisma.tenant.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      select: { id: true },
    });

    for (const tenant of tenants) {
      await this.inventoryQueue.add('check-low-stock', { tenantId: tenant.id });
    }

    this.logger.debug(`Low-stock check scheduled for ${tenants.length} tenants`);
  }

  @Cron('0 6 * * *')
  async scheduleOverdueInvoices(): Promise<void> {
    const tenants = await this.prisma.tenant.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      select: { id: true },
    });

    for (const tenant of tenants) {
      await this.financialQueue.add('mark-overdue-invoices', { tenantId: tenant.id });
    }

    this.logger.debug(`Overdue invoices scheduled for ${tenants.length} tenants`);
  }
}
