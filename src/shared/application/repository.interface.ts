export interface IRepository<T> {
  findById(id: string, tenantId?: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  update(entity: T): Promise<T>;
  delete(id: string, tenantId?: string): Promise<void>;
}
