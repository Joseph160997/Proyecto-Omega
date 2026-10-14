import { cx } from '@/lib/cx'

import type { ReactNode } from 'react'

export type StatusChipTone = 'ok' | 'warn' | 'busy' | 'neutral'

const TONE: Record<StatusChipTone, string> = {
  ok: 'text-up',
  warn: 'text-warning',
  busy: 'text-fg-muted',
  neutral: 'text-fg-muted',
}

interface StatusChipProps {
  tone?: StatusChipTone
  className?: string
  children: ReactNode
}

export function StatusChip({ tone = 'neutral', className, children }: StatusChipProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 text-xs',
        TONE[tone],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          'size-1.5 shrink-0 rounded-full bg-current',
          tone === 'busy' && 'motion-safe:animate-pulse',
        )}
      />
      {children}
    </span>
  )
}
