// src/features/markets/MarketsPage.tsx
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { StatusChip } from '@/components/ui/StatusChip'
import { newestQuoteTimestamp } from '@/domain/market/quote'
import { DataFreshness } from '@/features/markets/DataFreshness'
import { describeMarketError } from '@/features/markets/marketErrors'
import { MarketExplorer } from '@/features/markets/MarketExplorer'
import { MarketTableSkeleton } from '@/features/markets/MarketTableSkeleton'
import { useRefreshFailureToast } from '@/features/markets/useRefreshFailureToast'
import { useMarketListing } from '@/features/markets/useMarketListing'

export function MarketsPage() {
  const { data, error, isPending, isFetching, isRefetchError, refetch } = useMarketListing()

  useRefreshFailureToast({ isRefetchError, error, refetch })

  const timestamp = data ? newestQuoteTimestamp(data.quotes) : undefined

  return (
    <section className="space-y-6">
      <PageHeader
        title="Markets"
        description="Top 250 criptomonedas por capitalización, datos de CoinGecko."
        actions={
          <Button size="sm" onClick={() => refetch()} loading={isFetching}>
            {isFetching ? 'Actualizando…' : 'Actualizar'}
          </Button>
        }
      />

      {isPending ? <MarketTableSkeleton /> : null}

      {error && !data ? (
        <EmptyState title="No se pudo cargar el mercado" description={describeMarketError(error)} />
      ) : null}

      {data ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DataFreshness timestamp={timestamp} />

            {isRefetchError ? (
              <StatusChip tone="warn">
                No se pudo actualizar · se muestran los últimos datos
              </StatusChip>
            ) : null}

            {data.skipped > 0 ? (
              <p className="text-xs text-fg-muted">
                {data.skipped} activos descartados por datos inválidos.
              </p>
            ) : null}
          </div>

          <MarketExplorer quotes={data.quotes} />
        </div>
      ) : null}
    </section>
  )
}
