import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { ExpenseEntity, ExpenseStatus } from '../../../domain/entities/expense.entity';
import { RejectExpenseDto } from './reject-expense.dto';

@Injectable()
export class RejectExpenseUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(expenseId: string, dto: RejectExpenseDto, tenantId: string) {
    const record = await this.prisma.expense.findFirst({ where: { id: expenseId, tenantId } });
    if (!record) throw new NotFoundException('Expense not found');

    const expense = new ExpenseEntity({
      id: record.id,
      tenantId: record.tenantId,
      description: record.description,
      amount: Number(record.amount),
      category: record.category,
      requestedById: record.requestedById,
      status: record.status as ExpenseStatus,
      competenceDate: record.competenceDate,
    });

    expense.reject(dto.reason);

    return this.prisma.expense.update({
      where: { id: expenseId },
      data: { status: expense.status, rejectionReason: dto.reason, rejectedAt: new Date() },
    });
  }
}
