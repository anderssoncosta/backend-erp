import { PAGINATION } from '@shared/constants/pagination.constant';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export class Pagination {
  readonly page: number;
  readonly limit: number;
  readonly skip: number;

  constructor(params: PaginationParams = {}) {
    this.page = Math.max(1, params.page ?? PAGINATION.DEFAULT_PAGE);
    this.limit = Math.min(
      PAGINATION.MAX_LIMIT,
      Math.max(1, params.limit ?? PAGINATION.DEFAULT_LIMIT),
    );
    this.skip = (this.page - 1) * this.limit;
  }

  static buildMeta(total: number, page: number, limit: number): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
