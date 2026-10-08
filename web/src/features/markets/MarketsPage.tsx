// src/features/markets/MarketsPage.tsx
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { newestQuoteTimestamp } from '@/domain/market/quote'
import { DataFreshness } from '@/features/markets/DataFreshness'
import { MarketTable } from '@/features/markets/MarketTable'
import { describeMarketError } from '@/features/markets/marketErrors'
import { MarketTableSkeleton } from '@/features/markets/MarketTableSkeleton'
import { useMarketListing } from '@/features/markets/useMarketListing'

export function MarketsPage() {
  const { data, error, isPending, isFetching, refetch } = useMarketListing()

  const timestamp = data ? newestQuoteTimestamp(data.quotes) : undefined

  return (
    <section className="space-y-6">
      <PageHeader
        title="Markets"
        description="Top 250 criptomonedas por capitalización, datos de CoinGecko."
        actions={
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-lg border border-(--border) px-3 py-2 text-xs text-(--text-secondary) transition-colors hover:text-(--text-primary) disabled:opacity-50"
          >
            {isFetching ? 'Actualizando…' : 'Actualizar'}
          </button>
        }
      />

      {isPending ? <MarketTableSkeleton /> : null}

      {error && !data ? (
        <EmptyState title="No se pudo cargar el mercado" description={describeMarketError(error)} />
      ) : null}

      {error && data ? (
        <p role="alert" className="text-sm text-(--warning)">
          No se pudo actualizar. {describeMarketError(error)} Se muestran los últimos datos
          recibidos.
        </p>
      ) : null}

      {data ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DataFreshness timestamp={timestamp} />

            {data.skipped > 0 ? (
              <p className="text-xs text-(--text-secondary)">
                {data.skipped} activos descartados por datos inválidos.
              </p>
            ) : null}
          </div>

          <MarketTable quotes={data.quotes} />
        </div>
      ) : null}
    </section>
  )
}
