export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface Page {
  /** 1-based page number */
  page: number;
  size: number;
  offset: number;
}

export function parsePage(query: URLSearchParams): Page {
  const page = Math.max(1, Number.parseInt(query.get('page') ?? '1', 10) || 1);
  const requested = Number.parseInt(query.get('size') ?? '', 10) || DEFAULT_PAGE_SIZE;
  const size = Math.min(MAX_PAGE_SIZE, Math.max(1, requested));
  return { page, size, offset: (page - 1) * size };
}
