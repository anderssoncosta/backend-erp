import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { ExpenseEntity, ExpenseStatus } from '../../../domain/entities/expense.entity';

@Injectable()
export class ApproveExpenseUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(expenseId: string, approverId: string, tenantId: string) {
    const record = await this.prisma.expense.findFirst({ where: { id: expenseId, tenantId } });
    if (!record) throw new NotFoundException('Expense not found');

    const expense = new ExpenseEntity({
      id: record.id,
      tenantId: record.tenantId,
      description: record.description,
      amount: Number(record.amount),
      category: record.category,
      costCenterId: record.costCenterId ?? undefined,
      requestedById: record.requestedById,
      status: record.status as ExpenseStatus,
      competenceDate: record.competenceDate,
    });

    expense.approve(approverId);

    await this.prisma.expense.update({
      where: { id: expenseId },
      data: { status: expense.status, approvedById: approverId, approvedAt: new Date() },
    });

    for (const event of expense.collectDomainEvents()) {
      this.eventEmitter.emit(event.eventType, event);
    }

    return { id: expenseId, status: expense.status };
  }
}
