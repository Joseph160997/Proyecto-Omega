import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

import { cx } from '@/lib/cx'
import { formatPercentChange, percentChangeDirection } from '@/lib/format'

import type { LucideIcon } from 'lucide-react'
import type { ChangeDirection } from '@/lib/format'

const STYLES: Record<ChangeDirection, { tone: string; Icon: LucideIcon }> = {
  up: { tone: 'bg-up-soft text-up', Icon: ArrowUpRight },
  down: { tone: 'bg-down-soft text-down', Icon: ArrowDownRight },
  flat: { tone: 'bg-raised text-fg-muted', Icon: Minus },
}

interface ChangeChipProps {
  value: number | undefined
  className?: string
}

export function ChangeChip({ value, className }: ChangeChipProps) {
  const { tone, Icon } = STYLES[percentChangeDirection(value)]

  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs tabular-nums',
        tone,
        className,
      )}
    >
      <Icon size={12} aria-hidden="true" />
      {formatPercentChange(value)}
    </span>
  )
}
