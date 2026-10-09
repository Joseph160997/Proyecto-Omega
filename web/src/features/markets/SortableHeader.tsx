import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'

import type { SortDirection } from '@/features/markets/marketTableLogic'

interface SortableHeaderProps {
  label: string
  direction: SortDirection | null
  onSort: () => void
  align?: 'left' | 'right'
}

export function SortableHeader({ label, direction, onSort, align = 'right' }: SortableHeaderProps) {
  const Icon = direction === null ? ChevronsUpDown : direction === 'asc' ? ArrowUp : ArrowDown
  const ariaSort = direction === null ? undefined : direction === 'asc' ? 'ascending' : 'descending'

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={`px-4 py-3 font-medium ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      <button
        type="button"
        onClick={onSort}
        className="inline-flex items-center gap-1 rounded-md transition-colors hover:text-(--text-primary)"
      >
        {label}
        <Icon size={14} aria-hidden="true" />
      </button>
    </th>
  )
}
