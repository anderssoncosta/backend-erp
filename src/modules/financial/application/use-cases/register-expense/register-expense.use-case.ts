import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { RegisterExpenseDto } from './register-expense.dto';

@Injectable()
export class RegisterExpenseUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: RegisterExpenseDto, tenantId: string, userId: string) {
    return this.prisma.expense.create({
      data: {
        tenantId,
        description: dto.description,
        amount: dto.amount,
        category: dto.category,
        costCenterId: dto.costCenterId,
        requestedById: userId,
        status: 'PENDING',
        competenceDate: new Date(dto.referenceDate),
        attachmentUrl: dto.receiptUrl,
      },
    });
  }
}
