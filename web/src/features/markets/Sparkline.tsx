import { buildSparklinePath, sparklineTrend } from '@/features/markets/sparklineLogic'
import { formatPercentChange } from '@/lib/format'

import type { ChangeDirection } from '@/lib/format'

const COLOR: Record<ChangeDirection, string> = {
  up: 'text-(--positive)',
  down: 'text-(--negative)',
  flat: 'text-(--text-secondary)',
}

interface SparklineProps {
  values: readonly number[] | undefined
  width?: number
  height?: number
}

export function Sparkline({ values, width = 96, height = 32 }: SparklineProps) {
  const path = values === undefined ? null : buildSparklinePath(values, width, height)

  if (values === undefined || path === null) {
    return (
      <>
        <span aria-hidden="true" className="text-(--text-secondary)">
          —
        </span>
        <span className="sr-only">No 7-day data</span>
      </>
    )
  }

  const { direction, changePercent } = sparklineTrend(values)

  return (
    <svg
      role="img"
      aria-label={`Last 7 days: ${formatPercentChange(changePercent)}`}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={COLOR[direction]}
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
