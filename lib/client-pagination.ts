import { createPageItems, type PaginationItem } from "@/lib/pagination"

export const TERMINAL_TABLE_PAGE_SIZE = 10

export type { PaginationItem }

export type PaginatedItems<T> = {
  currentPage: number
  totalPages: number
  pageStartIndex: number
  visibleItems: T[]
  pageItems: PaginationItem[]
}

export const paginateItems = <T>(
  items: T[],
  requestedPage: number,
  pageSize = TERMINAL_TABLE_PAGE_SIZE,
): PaginatedItems<T> => {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(requestedPage, totalPages)
  const pageStartIndex = (currentPage - 1) * pageSize

  return {
    currentPage,
    totalPages,
    pageStartIndex,
    visibleItems: items.slice(pageStartIndex, pageStartIndex + pageSize),
    pageItems: createPageItems(currentPage, totalPages),
  }
}
