import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@Injectable()
export class FinancialService {
  constructor(private readonly prisma: PrismaService) {}

  listInvoices(tenantId: string, status?: string, clientId?: string, page: number = 1, limit: number = 20) {
    return this.prisma.invoice.findMany({
      where: { tenantId, ...(status && { status }), ...(clientId && { clientId }) },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  getInvoice(id: string, tenantId: string) {
    return this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: { items: true, payments: true },
    });
  }

  cancelInvoice(id: string, reason?: string) {
    return this.prisma.invoice.update({
      where: { id },
      data: { status: 'CANCELLED', notes: reason },
    });
  }

  listExpenses(tenantId: string, status?: string, category?: string, userId?: string, page: number = 1, limit: number = 20) {
    return this.prisma.expense.findMany({
      where: { tenantId, ...(status && { status }), ...(category && { category }), ...(userId && { userId }) },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  listCostCenters(tenantId: string, isActive?: string) {
    return this.prisma.costCenter.findMany({
      where: { tenantId, ...(isActive !== undefined && { isActive: isActive === 'true' }) },
      orderBy: { code: 'asc' },
    });
  }

  async getSummary(tenantId: string, from?: string, to?: string) {
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

  async getCashFlow(tenantId: string, from: string, to: string) {
    const [payments, expenses] = await Promise.all([
      this.prisma.payment.findMany({
        where: { tenantId, paidAt: { gte: new Date(from), lte: new Date(to) } },
        orderBy: { paidAt: 'asc' },
      }),
      this.prisma.expense.findMany({
        where: { tenantId, status: 'PAID', paidAt: { gte: new Date(from), lte: new Date(to) } },
        orderBy: { paidAt: 'asc' },
      }),
    ]);

    return { inflows: payments, outflows: expenses };
  }
}
