import { Panel } from '@/components/ui/Panel'
import { Skeleton } from '@/components/ui/Skeleton'

interface MarketTableSkeletonProps {
  rows?: number
}

export function MarketTableSkeleton({ rows = 8 }: MarketTableSkeletonProps) {
  return (
    <Panel padding="none" role="status" aria-busy="true">
      <span className="sr-only">Cargando mercados…</span>

      <div aria-hidden="true" className="divide-y divide-line">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="ml-auto h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="hidden h-4 w-24 md:block" />
          </div>
        ))}
      </div>
    </Panel>
  )
}
