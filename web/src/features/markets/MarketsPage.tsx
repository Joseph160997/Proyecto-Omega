import { EmptyState } from '@/components/feedback/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { MarketQuotesUnavailableError } from '@/features/markets/marketQueries'
import { useMarketQuotes } from '@/features/markets/useMarketQuotes'
import { formatCompactUsd, formatPercentChange, formatUsdPrice } from '@/lib/format'

export function MarketsPage() {
  const { data, error, isPending, isFetching, dataUpdatedAt, refetch } = useMarketQuotes()

  // Provisional: muestra el `kind` crudo para diagnosticar. El M4b lo traduce.
  const failureKind =
    error instanceof MarketQuotesUnavailableError
      ? (error.failures[0]?.error.kind ?? 'DESCONOCIDO')
      : (error?.message ?? null)

  return (
    <section className="space-y-6">
      <PageHeader
        title="Markets"
        description="Versión provisional: datos reales de CoinGecko."
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
            {data.quotes.length} cotizaciones, {data.failures.length} fallos. Actualizado:{' '}
            {new Date(dataUpdatedAt).toLocaleTimeString()}
          </p>

          <ul className="divide-y divide-(--border) rounded-2xl border border-(--border) bg-(--surface)">
            {data.quotes.map((quote) => (
              <li
                key={quote.assetId}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
              >
                <span className="font-medium">
                  {quote.symbol} <span className="text-(--text-secondary)">{quote.name}</span>
                </span>
                <span className="font-mono tabular-nums">{formatUsdPrice(quote.price)}</span>
                <span className="font-mono text-xs tabular-nums">
                  {formatPercentChange(quote.change24hPercent)}
                </span>
                <span className="text-xs text-(--text-secondary)">
                  Cap. {formatCompactUsd(quote.marketCap)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
