"use client"

import { useEffect, useMemo, useState } from "react"
import { paginateItems, TERMINAL_TABLE_PAGE_SIZE } from "@/lib/client-pagination"

export const useClientPagination = <T>(items: T[]) => {
  const [page, setPage] = useState(1)

  const pagination = useMemo(() => paginateItems(items, page, TERMINAL_TABLE_PAGE_SIZE), [items, page])

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages)
    }
  }, [items.length, page, pagination.totalPages])

  return {
    ...pagination,
    setPage,
  }
}
