import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { InvoiceEntity } from '../../../domain/entities/invoice.entity';
import { InvoiceItemEntity } from '../../../domain/entities/invoice-item.entity';
import { InvoiceStatus } from '../../../domain/value-objects/invoice-status.vo';
import { RegisterPaymentDto } from './register-payment.dto';

@Injectable()
export class RegisterPaymentUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(invoiceId: string, dto: RegisterPaymentDto, tenantId: string, userId: string) {
    const record = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: { items: true },
    });
    if (!record) throw new NotFoundException('Invoice not found');

    const invoice = InvoiceEntity.reconstitute({
      id: record.id,
      tenantId: record.tenantId,
      invoiceNumber: record.invoiceNumber,
      clientId: record.clientId ?? undefined,
      costCenterId: record.costCenterId ?? undefined,
      status: record.status as InvoiceStatus,
      dueDate: record.dueDate,
      totalAmount: Number(record.totalAmount),
      paidAmount: Number(record.paidAmount),
      notes: record.notes ?? undefined,
      items: record.items.map(
        (i) =>
          new InvoiceItemEntity({
            id: i.id,
            description: i.description,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
          }),
      ),
    });

    invoice.registerPayment(dto.amount);

    const [payment] = await this.prisma.$transaction([
      this.prisma.payment.create({
        data: {
          invoiceId,
          tenantId,
          amount: dto.amount,
          method: dto.method,
          paidAt: new Date(dto.paidAt),
          reference: dto.reference,
          notes: dto.notes,
          registeredById: userId,
        },
      }),
      this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { paidAmount: invoice.paidAmount, status: invoice.status },
      }),
    ]);

    for (const event of invoice.collectDomainEvents()) {
      this.eventEmitter.emit(event.eventType, event);
    }

    return payment;
  }
}
