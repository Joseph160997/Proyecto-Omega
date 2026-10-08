interface MarketTableSkeletonProps {
  rows?: number
}

export function MarketTableSkeleton({ rows = 8 }: MarketTableSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      className="rounded-2xl border border-(--border) bg-(--surface)"
    >
      <span className="sr-only">Cargando mercados…</span>

      <div aria-hidden="true" className="divide-y divide-(--border)">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-4">
            <div className="h-4 w-40 rounded bg-(--border) motion-safe:animate-pulse" />
            <div className="ml-auto h-4 w-20 rounded bg-(--border) motion-safe:animate-pulse" />
            <div className="h-4 w-16 rounded bg-(--border) motion-safe:animate-pulse" />
            <div className="hidden h-4 w-24 rounded bg-(--border) motion-safe:animate-pulse md:block" />
          </div>
        ))}
      </div>
    </div>
  )
}
