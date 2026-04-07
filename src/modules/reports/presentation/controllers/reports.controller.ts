import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'reports', version: '1' })
export class ReportsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('service-orders')
  @ApiOperation({ summary: 'Service orders report' })
  @Permissions('reports', 'read')
  async serviceOrders(
    @CurrentTenant() tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const dateFilter = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };
    const createdAt = Object.keys(dateFilter).length ? dateFilter : undefined;

    const [byStatus, byPriority, totals] = await Promise.all([
      this.prisma.serviceOrder.groupBy({
        by: ['status'],
        where: { tenantId, ...(createdAt && { createdAt }) },
        _count: { id: true },
      }),
      this.prisma.serviceOrder.groupBy({
        by: ['priority'],
        where: { tenantId, ...(createdAt && { createdAt }) },
        _count: { id: true },
      }),
      this.prisma.serviceOrder.count({ where: { tenantId, ...(createdAt && { createdAt }) } }),
    ]);

    return { total: totals, byStatus, byPriority };
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Inventory report' })
  @Permissions('reports', 'read')
  async inventory(@CurrentTenant() tenantId: string) {
    const [stockItems, movements] = await Promise.all([
      this.prisma.stockItem.findMany({
        where: { tenantId, isActive: true },
        include: { material: { select: { id: true, name: true, code: true, minStock: true } } },
        orderBy: { quantity: 'asc' },
        take: 20,
      }),
      this.prisma.stockMovement.groupBy({
        by: ['type'],
        where: { tenantId },
        _count: { id: true },
        _sum: { quantity: true },
      }),
    ]);

    const lowStockItems = stockItems.filter((s) => s.quantity <= (s.material.minStock ?? 0));
    return { totalStockItems: stockItems.length, lowStockItems, movementsByType: movements };
  }

  @Get('financial')
  @ApiOperation({ summary: 'Financial report' })
  @Permissions('reports', 'read')
  async financial(
    @CurrentTenant() tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const dateFilter = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };
    const createdAt = Object.keys(dateFilter).length ? dateFilter : undefined;

    const [invoicesByStatus, expensesByCategory, revenue, expenses] = await Promise.all([
      this.prisma.invoice.groupBy({
        by: ['status'],
        where: { tenantId, ...(createdAt && { createdAt }) },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.expense.groupBy({
        by: ['category'],
        where: { tenantId, ...(createdAt && { createdAt }) },
        _count: { id: true },
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: { tenantId, ...(createdAt && { createdAt }) },
        _sum: { totalAmount: true, paidAmount: true },
      }),
      this.prisma.expense.aggregate({
        where: { tenantId, status: 'PAID', ...(createdAt && { createdAt }) },
        _sum: { amount: true },
      }),
    ]);

    return {
      invoicesByStatus,
      expensesByCategory,
      totalRevenue: Number(revenue._sum.totalAmount ?? 0),
      totalReceived: Number(revenue._sum.paidAmount ?? 0),
      totalExpenses: Number(expenses._sum.amount ?? 0),
    };
  }

  @Get('hr')
  @ApiOperation({ summary: 'HR report' })
  @Permissions('reports', 'read')
  async hr(@CurrentTenant() tenantId: string) {
    const [byStatus, byPosition, total] = await Promise.all([
      this.prisma.employee.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { id: true },
      }),
      this.prisma.employee.groupBy({
        by: ['positionId'],
        where: { tenantId, status: 'ACTIVE' },
        _count: { id: true },
      }),
      this.prisma.employee.count({ where: { tenantId } }),
    ]);

    return { total, byStatus, byPosition };
  }

  @Get('fleet')
  @ApiOperation({ summary: 'Fleet report' })
  @Permissions('reports', 'read')
  async fleet(@CurrentTenant() tenantId: string) {
    const [byStatus, total] = await Promise.all([
      this.prisma.vehicle.groupBy({
        by: ['status'],
        where: { tenantId, isActive: true },
        _count: { id: true },
      }),
      this.prisma.vehicle.count({ where: { tenantId, isActive: true } }),
    ]);

    return { total, byStatus };
  }

  @Get('productivity')
  @ApiOperation({ summary: 'Team productivity report' })
  @Permissions('reports', 'read')
  async productivity(
    @CurrentTenant() tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const dateFilter = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };
    const startedAt = Object.keys(dateFilter).length ? dateFilter : undefined;

    return this.prisma.timeEntry.groupBy({
      by: ['userId'],
      where: {
        tenantId,
        endedAt: { not: null },
        ...(startedAt && { startedAt }),
      },
      _sum: { durationMinutes: true },
      _count: { id: true },
    });
  }
}
