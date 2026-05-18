import { paginateItems, TERMINAL_TABLE_PAGE_SIZE } from "@/lib/client-pagination"

describe("paginateItems", () => {
  it("returns an empty visible slice for an empty list", () => {
    const page = paginateItems([], 1)

    expect(page.currentPage).toBe(1)
    expect(page.totalPages).toBe(1)
    expect(page.visibleItems).toEqual([])
    expect(page.pageItems).toEqual([1])
  })

  it("returns all items on a single page when count is at or below page size", () => {
    const items = Array.from({ length: TERMINAL_TABLE_PAGE_SIZE }, (_, index) => index + 1)
    const page = paginateItems(items, 1)

    expect(page.currentPage).toBe(1)
    expect(page.totalPages).toBe(1)
    expect(page.visibleItems).toHaveLength(TERMINAL_TABLE_PAGE_SIZE)
    expect(page.pageItems).toEqual([1])
  })

  it("splits items across pages", () => {
    const items = Array.from({ length: 25 }, (_, index) => index + 1)
    const page = paginateItems(items, 2)

    expect(page.currentPage).toBe(2)
    expect(page.totalPages).toBe(3)
    expect(page.pageStartIndex).toBe(TERMINAL_TABLE_PAGE_SIZE)
    expect(page.visibleItems).toEqual(items.slice(TERMINAL_TABLE_PAGE_SIZE, TERMINAL_TABLE_PAGE_SIZE * 2))
  })

  it("caps the current page to the last page", () => {
    const items = Array.from({ length: 12 }, (_, index) => index + 1)
    const page = paginateItems(items, 99)

    expect(page.currentPage).toBe(2)
    expect(page.totalPages).toBe(2)
    expect(page.visibleItems).toHaveLength(2)
  })

  it("builds ellipsis page items for large page counts", () => {
    const items = Array.from({ length: 120 }, (_, index) => index + 1)
    const page = paginateItems(items, 5)

    expect(page.pageItems).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 12])
  })
})
