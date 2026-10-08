// src/features/markets/MarketsPage.tsx
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { MarketTable } from '@/features/markets/MarketTable'
import { MarketListingUnavailableError } from '@/features/markets/marketQueries'
import { useMarketListing } from '@/features/markets/useMarketListing'

export function MarketsPage() {
  const { data, error, isPending, isFetching, dataUpdatedAt, refetch } = useMarketListing()

  // Provisional: muestra el `kind` crudo para diagnosticar. El paso 4 lo traduce.
  const failureKind =
    error instanceof MarketListingUnavailableError ? error.reason.kind : (error?.message ?? null)

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

      {isPending ? <p role="status">Cargando mercados…</p> : null}

      {error && !data ? (
        <EmptyState title="No se pudo cargar el mercado" description={`Motivo: ${failureKind}`} />
      ) : null}

      {error && data ? (
        <p role="alert" className="text-sm text-(--warning)">
          No se pudo actualizar ({failureKind}). Mostrando datos anteriores.
        </p>
      ) : null}

      {data ? (
        <div className="space-y-3">
          <p className="text-xs text-(--text-secondary)">
            {data.skipped > 0 ? `${data.skipped} descartadas. ` : ''}
            Actualizado: {new Date(dataUpdatedAt).toLocaleTimeString()}
          </p>

          <MarketTable quotes={data.quotes} />
        </div>
      ) : null}
    </section>
  )
}
