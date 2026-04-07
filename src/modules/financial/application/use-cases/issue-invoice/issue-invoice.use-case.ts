import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { InvoiceEntity } from '../../../domain/entities/invoice.entity';
import { INVOICE_REPOSITORY, IInvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import { IssueInvoiceDto } from './issue-invoice.dto';

@Injectable()
export class IssueInvoiceUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(INVOICE_REPOSITORY) private readonly invoiceRepository: IInvoiceRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: IssueInvoiceDto, tenantId: string, userId: string) {
    const invoiceNumber = await this.invoiceRepository.generateInvoiceNumber(tenantId);

    const invoice = InvoiceEntity.create({
      tenantId,
      invoiceNumber,
      clientId: dto.clientId,
      costCenterId: dto.costCenterId,
      dueDate: new Date(dto.dueDate),
      notes: dto.notes,
      items: dto.items,
    });

    invoice.issue();

    const saved = await this.prisma.invoice.create({
      data: {
        id: invoice.id,
        tenantId,
        invoiceNumber: invoice.invoiceNumber,
        clientId: invoice.clientId,
        costCenterId: invoice.costCenterId,
        status: invoice.status,
        type: 'SERVICE',
        dueDate: invoice.dueDate,
        subtotal: invoice.totalAmount,
        totalAmount: invoice.totalAmount,
        paidAmount: 0,
        notes: invoice.notes,
        createdById: userId,
        items: {
          create: invoice.items.map((item: InvoiceEntity['items'][number]) => ({
            id: item.id,
            tenantId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.totalPrice,
          })),
        },
      },
      include: { items: true },
    });

    for (const event of invoice.collectDomainEvents()) {
      this.eventEmitter.emit(event.eventType, event);
    }

    return saved;
  }
}
