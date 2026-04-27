import { Module } from '@nestjs/common';
import { INVOICE_REPOSITORY } from './domain/repositories/invoice.repository.interface';
import { InvoicePrismaRepository } from './infrastructure/repositories/invoice.prisma.repository';
import { OverdueInvoicesProcessor } from './infrastructure/jobs/overdue-invoices.processor';
import { IssueInvoiceUseCase } from './application/use-cases/issue-invoice/issue-invoice.use-case';
import { RegisterPaymentUseCase } from './application/use-cases/register-payment/register-payment.use-case';
import { RegisterExpenseUseCase } from './application/use-cases/register-expense/register-expense.use-case';
import { ApproveExpenseUseCase } from './application/use-cases/approve-expense/approve-expense.use-case';
import { RejectExpenseUseCase } from './application/use-cases/reject-expense/reject-expense.use-case';
import { CreateCostCenterUseCase } from './application/use-cases/create-cost-center/create-cost-center.use-case';
import { FinancialService } from './application/services/financial.service';
import { FinancialController } from './presentation/controllers/financial.controller';

@Module({
  controllers: [FinancialController],
  providers: [
    { provide: INVOICE_REPOSITORY, useClass: InvoicePrismaRepository },
    OverdueInvoicesProcessor,
    IssueInvoiceUseCase,
    RegisterPaymentUseCase,
    RegisterExpenseUseCase,
    ApproveExpenseUseCase,
    RejectExpenseUseCase,
    CreateCostCenterUseCase,
    FinancialService,
  ],
})
export class FinancialModule {}
