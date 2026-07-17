export type PaginationInput = { page?: number; pageSize?: number; query?: string };
export type Paginated<T> = { items: T[]; page: number; pageSize: number; total: number; totalPages: number };

export function normalizePagination(input: PaginationInput) {
  const page = Math.max(1, Math.trunc(input.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.trunc(input.pageSize ?? 10)));
  return { page, pageSize, query: input.query?.trim() ?? "" };
}
