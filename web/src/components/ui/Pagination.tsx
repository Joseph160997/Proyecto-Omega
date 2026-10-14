import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cx } from '@/lib/cx'
import { pageWindow } from '@/lib/pagination'

import type { ReactNode } from 'react'

const BUTTON =
  'inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-medium transition-colors'

interface StepButtonProps {
  label: string
  disabled: boolean
  onClick: () => void
  children: ReactNode
}

function StepButton({ label, disabled, onClick, children }: StepButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        BUTTON,
        'border-line text-fg-muted hover:bg-raised hover:text-fg',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
      )}
    >
      {children}
    </button>
  )
}

interface PaginationProps {
  /** Página efectiva (la que devuelve `paginate`). */
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Paginación" className={cx('flex flex-wrap items-center gap-1', className)}>
      <StepButton
        label="Página anterior"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft size={14} aria-hidden="true" />
      </StepButton>

      {pageWindow(page, totalPages).map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-fg-subtle">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-label={`Página ${item}`}
            aria-current={item === page ? 'page' : undefined}
            onClick={() => onPageChange(item)}
            className={cx(
              BUTTON,
              item === page
                ? 'border-accent-fill bg-accent-fill text-on-accent'
                : 'border-line text-fg-muted hover:bg-raised hover:text-fg',
            )}
          >
            {item}
          </button>
        ),
      )}

      <StepButton
        label="Página siguiente"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight size={14} aria-hidden="true" />
      </StepButton>
    </nav>
  )
}
