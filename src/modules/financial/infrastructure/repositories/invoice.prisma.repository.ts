import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { IInvoiceRepository } from '../../domain/repositories/invoice.repository.interface';

@Injectable()
export class InvoicePrismaRepository implements IInvoiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async generateInvoiceNumber(tenantId: string): Promise<string> {
    const count = await this.prisma.invoice.count({ where: { tenantId } });
    const year = new Date().getFullYear();
    return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  async findOverdue(tenantId: string): Promise<Array<{ id: string }>> {
    return this.prisma.invoice.findMany({
      where: { tenantId, status: { in: ['ISSUED', 'SENT', 'PARTIALLY_PAID'] }, dueDate: { lt: new Date() } },
      select: { id: true },
    });
  }
}
