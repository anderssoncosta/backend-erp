import {
  Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '@shared/presentation/decorators/current-user.decorator';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { IssueInvoiceUseCase } from '../../application/use-cases/issue-invoice/issue-invoice.use-case';
import { IssueInvoiceDto } from '../../application/use-cases/issue-invoice/issue-invoice.dto';
import { RegisterPaymentUseCase } from '../../application/use-cases/register-payment/register-payment.use-case';
import { RegisterPaymentDto } from '../../application/use-cases/register-payment/register-payment.dto';
import { RegisterExpenseUseCase } from '../../application/use-cases/register-expense/register-expense.use-case';
import { RegisterExpenseDto } from '../../application/use-cases/register-expense/register-expense.dto';
import { ApproveExpenseUseCase } from '../../application/use-cases/approve-expense/approve-expense.use-case';
import { RejectExpenseUseCase } from '../../application/use-cases/reject-expense/reject-expense.use-case';
import { RejectExpenseDto } from '../../application/use-cases/reject-expense/reject-expense.dto';
import { CreateCostCenterUseCase } from '../../application/use-cases/create-cost-center/create-cost-center.use-case';
import { CreateCostCenterDto } from '../../application/use-cases/create-cost-center/create-cost-center.dto';

@ApiTags('Financial')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'financial', version: '1' })
export class FinancialController {
  constructor(
    private readonly issueInvoiceUseCase: IssueInvoiceUseCase,
    private readonly registerPaymentUseCase: RegisterPaymentUseCase,
    private readonly registerExpenseUseCase: RegisterExpenseUseCase,
    private readonly approveExpenseUseCase: ApproveExpenseUseCase,
    private readonly rejectExpenseUseCase: RejectExpenseUseCase,
    private readonly createCostCenterUseCase: CreateCostCenterUseCase,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Invoices ────────────────────────────────────────────────────────────

  @Post('invoices')
  @ApiOperation({ summary: 'Issue a new invoice' })
  @Permissions('financial', 'create')
  createInvoice(
    @Body() dto: IssueInvoiceDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.issueInvoiceUseCase.execute(dto, tenantId, user.id);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'List invoices' })
  @Permissions('financial', 'read')
  listInvoices(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.prisma.invoice.findMany({
      where: {
        tenantId,
        ...(status && { status }),
        ...(clientId && { clientId }),
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @Permissions('financial', 'read')
  getInvoice(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: { items: true, payments: true },
    });
  }

  @Patch('invoices/:id/cancel')
  @ApiOperation({ summary: 'Cancel invoice' })
  @Permissions('financial', 'update')
  cancelInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() body: { reason?: string },
  ) {
    return this.prisma.invoice.update({
      where: { id },
      data: { status: 'CANCELLED', notes: body.reason },
    });
  }

  // ─── Payments ────────────────────────────────────────────────────────────

  @Post('invoices/:id/payments')
  @ApiOperation({ summary: 'Register payment for invoice' })
  @Permissions('financial', 'create')
  addPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegisterPaymentDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.registerPaymentUseCase.execute(id, dto, tenantId, user.id);
  }

  // ─── Expenses ────────────────────────────────────────────────────────────

  @Post('expenses')
  @ApiOperation({ summary: 'Register expense' })
  @Permissions('financial', 'create')
  createExpense(
    @Body() dto: RegisterExpenseDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.registerExpenseUseCase.execute(dto, tenantId, user.id);
  }

  @Get('expenses')
  @ApiOperation({ summary: 'List expenses' })
  @Permissions('financial', 'read')
  listExpenses(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('userId') userId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.prisma.expense.findMany({
      where: {
        tenantId,
        ...(status && { status }),
        ...(category && { category }),
        ...(userId && { userId }),
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  @Patch('expenses/:id/approve')
  @ApiOperation({ summary: 'Approve expense' })
  @Permissions('financial', 'update')
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.approveExpenseUseCase.execute(id, user.id, tenantId);
  }

  @Patch('expenses/:id/reject')
  @ApiOperation({ summary: 'Reject expense' })
  @Permissions('financial', 'update')
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectExpenseDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.rejectExpenseUseCase.execute(id, dto, tenantId);
  }

  // ─── Cost Centers ─────────────────────────────────────────────────────────

  @Post('cost-centers')
  @ApiOperation({ summary: 'Create cost center' })
  @Permissions('financial', 'create')
  createCostCenter(@Body() dto: CreateCostCenterDto, @CurrentTenant() tenantId: string) {
    return this.createCostCenterUseCase.execute(dto, tenantId);
  }

  @Get('cost-centers')
  @ApiOperation({ summary: 'List cost centers' })
  @Permissions('financial', 'read')
  listCostCenters(@CurrentTenant() tenantId: string, @Query('isActive') isActive?: string) {
    return this.prisma.costCenter.findMany({
      where: { tenantId, ...(isActive !== undefined && { isActive: isActive === 'true' }) },
      orderBy: { code: 'asc' },
    });
  }

  // ─── Reports ─────────────────────────────────────────────────────────────

  @Get('reports/summary')
  @ApiOperation({ summary: 'Financial summary' })
  @Permissions('financial', 'read')
  async getSummary(
    @CurrentTenant() tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const dateFilter = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };
    const createdAt = Object.keys(dateFilter).length ? dateFilter : undefined;

    const [invoiceTotals, expenseTotals, paidInvoices] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: { tenantId, ...(createdAt && { createdAt }) },
        _sum: { totalAmount: true, paidAmount: true },
        _count: { id: true },
      }),
      this.prisma.expense.aggregate({
        where: { tenantId, status: 'PAID', ...(createdAt && { createdAt }) },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.invoice.count({ where: { tenantId, status: 'PAID', ...(createdAt && { createdAt }) } }),
    ]);

    const totalRevenue = Number(invoiceTotals._sum.totalAmount ?? 0);
    const totalReceived = Number(invoiceTotals._sum.paidAmount ?? 0);
    const totalExpenses = Number(expenseTotals._sum.amount ?? 0);

    return {
      totalRevenue,
      totalReceived,
      totalPending: totalRevenue - totalReceived,
      totalExpenses,
      netProfit: totalReceived - totalExpenses,
      invoiceCount: invoiceTotals._count.id,
      paidInvoiceCount: paidInvoices,
      expenseCount: expenseTotals._count.id,
    };
  }

  @Get('reports/cash-flow')
  @ApiOperation({ summary: 'Cash flow report' })
  @Permissions('financial', 'read')
  async getCashFlow(
    @CurrentTenant() tenantId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const [payments, expenses] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          tenantId,
          paidAt: { gte: new Date(from), lte: new Date(to) },
        },
        orderBy: { paidAt: 'asc' },
      }),
      this.prisma.expense.findMany({
        where: {
          tenantId,
          status: 'PAID',
          paidAt: { gte: new Date(from), lte: new Date(to) },
        },
        orderBy: { paidAt: 'asc' },
      }),
    ]);

    return { inflows: payments, outflows: expenses };
  }
}
