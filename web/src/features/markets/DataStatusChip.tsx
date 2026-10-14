import { StatusChip } from '@/components/ui/StatusChip'
import { describeDataStatus } from '@/features/markets/marketDataStatus'
import { useMarketDataStatus } from '@/features/markets/useMarketDataStatus'

interface DataStatusChipProps {
  className?: string
}

export function DataStatusChip({ className }: DataStatusChipProps) {
  const view = describeDataStatus(useMarketDataStatus())

  if (view === null) return null

  return (
    <StatusChip tone={view.tone} className={className}>
      {view.label}
    </StatusChip>
  )
}
