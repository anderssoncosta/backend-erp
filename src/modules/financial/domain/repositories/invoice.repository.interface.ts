export const INVOICE_REPOSITORY = 'INVOICE_REPOSITORY';

export interface IInvoiceRepository {
  generateInvoiceNumber(tenantId: string): Promise<string>;
  findOverdue(tenantId: string): Promise<Array<{ id: string }>>;
}
