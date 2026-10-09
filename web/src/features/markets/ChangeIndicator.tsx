import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

import { formatPercentChange, percentChangeDirection } from '@/lib/format'

import type { LucideIcon } from 'lucide-react'
import type { ChangeDirection } from '@/lib/format'

const STYLES: Record<ChangeDirection, { className: string; Icon: LucideIcon }> = {
  up: { className: 'text-(--positive)', Icon: ArrowUpRight },
  down: { className: 'text-(--negative)', Icon: ArrowDownRight },
  flat: { className: 'text-(--text-secondary)', Icon: Minus },
}

interface ChangeIndicatorProps {
  value: number | undefined
}

export function ChangeIndicator({ value }: ChangeIndicatorProps) {
  const { className, Icon } = STYLES[percentChangeDirection(value)]

  return (
    <span className={`inline-flex items-center gap-1 font-mono tabular-nums ${className}`}>
      <Icon size={14} aria-hidden="true" />
      {formatPercentChange(value)}
    </span>
  )
}
