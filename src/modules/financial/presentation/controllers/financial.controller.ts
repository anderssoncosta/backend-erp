import {
  Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '@shared/presentation/decorators/current-user.decorator';
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
import { FinancialService } from '../../application/services/financial.service';

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
    private readonly financialService: FinancialService,
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
    return this.financialService.listInvoices(tenantId, status, clientId, page, limit);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @Permissions('financial', 'read')
  getInvoice(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.financialService.getInvoice(id, tenantId);
  }

  @Patch('invoices/:id/cancel')
  @ApiOperation({ summary: 'Cancel invoice' })
  @Permissions('financial', 'update')
  cancelInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason?: string },
  ) {
    return this.financialService.cancelInvoice(id, body.reason);
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
    return this.financialService.listExpenses(tenantId, status, category, userId, page, limit);
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
    return this.financialService.listCostCenters(tenantId, isActive);
  }

  // ─── Reports ─────────────────────────────────────────────────────────────

  @Get('reports/summary')
  @ApiOperation({ summary: 'Financial summary' })
  @Permissions('financial', 'read')
  getSummary(
    @CurrentTenant() tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.financialService.getSummary(tenantId, from, to);
  }

  @Get('reports/cash-flow')
  @ApiOperation({ summary: 'Cash flow report' })
  @Permissions('financial', 'read')
  getCashFlow(
    @CurrentTenant() tenantId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.financialService.getCashFlow(tenantId, from, to);
  }
}
