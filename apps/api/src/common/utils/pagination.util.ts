export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function buildPaginationArgs(input: PaginationInput): {
  skip: number;
  take: number;
} {
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(100, Math.max(1, input.limit ?? 20));
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  input: PaginationInput,
): PaginatedResult<T> {
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(100, Math.max(1, input.limit ?? 20));
  const totalPages = Math.ceil(total / limit);

  return {
    items,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
