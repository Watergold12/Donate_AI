import { Button } from '../atoms/Button'

interface PaginationProps { page: number; pages: number; total: number; onPageChange: (page: number) => void }

export function Pagination({ page, pages, total, onPageChange }: PaginationProps) {
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-between py-3">
      <p className="text-sm text-gray-500 dark:text-gray-400">{total} total results</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</Button>
        <span className="text-sm text-gray-700 dark:text-gray-300">Page {page} of {pages}</span>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>Next</Button>
      </div>
    </div>
  )
}
