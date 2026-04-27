import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async serviceOrders(tenantId: string, from?: string, to?: string) {
    const dateFilter = { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) };
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

  async inventory(tenantId: string) {
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

  async financial(tenantId: string, from?: string, to?: string) {
    const dateFilter = { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) };
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

  async hr(tenantId: string) {
    const [byStatus, byPosition, total] = await Promise.all([
      this.prisma.employee.groupBy({ by: ['status'], where: { tenantId }, _count: { id: true } }),
      this.prisma.employee.groupBy({ by: ['positionId'], where: { tenantId, status: 'ACTIVE' }, _count: { id: true } }),
      this.prisma.employee.count({ where: { tenantId } }),
    ]);
    return { total, byStatus, byPosition };
  }

  async fleet(tenantId: string) {
    const [byStatus, total] = await Promise.all([
      this.prisma.vehicle.groupBy({ by: ['status'], where: { tenantId, isActive: true }, _count: { id: true } }),
      this.prisma.vehicle.count({ where: { tenantId, isActive: true } }),
    ]);
    return { total, byStatus };
  }

  productivity(tenantId: string, from?: string, to?: string) {
    const dateFilter = { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) };
    const startedAt = Object.keys(dateFilter).length ? dateFilter : undefined;

    return this.prisma.timeEntry.groupBy({
      by: ['userId'],
      where: { tenantId, endedAt: { not: null }, ...(startedAt && { startedAt }) },
      _sum: { durationMinutes: true },
      _count: { id: true },
    });
  }
}
