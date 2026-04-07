import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { QUEUE_NAMES } from '@shared/constants/queue-names.constant';

@Processor(QUEUE_NAMES.FINANCIAL)
export class OverdueInvoicesProcessor {
  private readonly logger = new Logger(OverdueInvoicesProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process('check-overdue')
  async handleOverdue(job: Job<{ tenantId: string }>): Promise<void> {
    const { tenantId } = job.data;
    const now = new Date();

    const result = await this.prisma.invoice.updateMany({
      where: {
        tenantId,
        status: { in: ['ISSUED', 'SENT', 'PARTIALLY_PAID'] },
        dueDate: { lt: now },
      },
      data: { status: 'OVERDUE' },
    });

    if (result.count > 0) {
      this.logger.log(`Marked ${result.count} invoices as overdue for tenant ${tenantId}`);
    }
  }
}
