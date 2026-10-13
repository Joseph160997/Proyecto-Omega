
import { Link } from 'react-router-dom'

import { cx } from '@/lib/cx'

export interface PillNavItem {
  id: string
  label: string
  to: string
}

interface PillNavProps {
  items: readonly PillNavItem[]
  currentId: string
  /** Nombre de esta navegación para lectores de pantalla. */
  label: string
  className?: string
}

export function PillNav({ items, currentId, label, className }: PillNavProps) {
  return (
    <nav aria-label={label} className={className}>
      <ul className="flex flex-wrap items-center gap-1.5">
        {items.map((item) => {
          const isCurrent = item.id === currentId

          return (
            <li key={item.id}>
              <Link
                to={item.to}
                aria-current={isCurrent ? 'page' : undefined}
                className={cx(
                  'inline-flex rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                  isCurrent
                    ? 'border-accent-fill bg-accent-fill text-on-accent'
                    : 'border-transparent text-fg-muted hover:bg-raised hover:text-fg',
                )}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}