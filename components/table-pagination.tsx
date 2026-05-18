"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PaginationItem } from "@/lib/client-pagination"

type TablePaginationProps = {
  currentPage: number
  totalPages: number
  pageItems: PaginationItem[]
  onPageChange: (page: number) => void
  ariaLabelPrefix?: string
}

export const TablePagination = ({
  currentPage,
  totalPages,
  pageItems,
  onPageChange,
  ariaLabelPrefix = "Table",
}: TablePaginationProps) => {
  if (totalPages <= 1) {
    return null
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  return (
    <div
      className="flex flex-col gap-2 border-t border-border/40 px-2 py-2 sm:flex-row sm:items-center sm:justify-end"
      role="navigation"
      aria-label={`${ariaLabelPrefix} pagination`}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="border border-border/50 bg-background/30 text-text-secondary hover:text-text-primary"
        disabled={currentPage <= 1}
        onClick={handlePrevious}
        aria-label={`Previous ${ariaLabelPrefix.toLowerCase()} page`}
      >
        <ChevronLeft className="size-4" />
      </Button>

      <div className="flex items-center gap-2">
        {pageItems.map((item, index) =>
          item === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className="px-1 font-mono text-sm text-text-secondary">
              ...
            </span>
          ) : (
            <Button
              key={item}
              type="button"
              variant={item === currentPage ? "default" : "ghost"}
              size="icon-sm"
              className={
                item === currentPage
                  ? "bg-gradient-to-br from-accent-blue to-accent-neon text-background shadow-lg shadow-accent-blue/20"
                  : "border border-border/50 bg-background/30 text-text-secondary hover:text-text-primary"
              }
              aria-current={item === currentPage ? "page" : undefined}
              aria-label={`${ariaLabelPrefix} page ${item}`}
              onClick={() => onPageChange(item)}
            >
              {item}
            </Button>
          ),
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="border border-border/50 bg-background/30 text-text-secondary hover:text-text-primary"
        disabled={currentPage >= totalPages}
        onClick={handleNext}
        aria-label={`Next ${ariaLabelPrefix.toLowerCase()} page`}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
