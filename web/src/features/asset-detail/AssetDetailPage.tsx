import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, X } from 'lucide-react'

import { EmptyState } from '@/components/feedback/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, buttonClassName } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { parseAssetId } from '@/domain/market/asset'
import { isCandleTimeframe } from '@/domain/market/candleTimeframe'
import { describeMarketDataError } from '@/features/markets/marketErrors'
import { AssetChart } from '@/features/asset-detail/AssetChart'
import {
  CandlesUnavailableError,
  quoteFailure,
  useAssetDetailQueries,
} from '@/features/asset-detail/assetDetailQueries'
import { QuickTrade } from '@/features/asset-detail/QuickTrade'
import { TimeframeSelector } from '@/features/asset-detail/TimeframeSelector'
import { ChangeChip } from '@/components/ui/ChangeChip'
import { formatUsdPrice } from '@/lib/format'

import type { CandleTimeframe } from '@/domain/market/candleTimeframe'

export function AssetDetailPage() {
  const { assetId } = useParams()
  const parsed = assetId ? parseAssetId(assetId) : undefined
  const validAssetId = parsed?.ok && parsed.value.type === 'crypto' ? assetId : undefined

  if (validAssetId === undefined) {
    return (
      <section className="space-y-6">
        <PageHeader title="Activo no disponible" description="No se reconoce este activo." />
        <EmptyState
          title="No se puede abrir este activo"
          description="Revisa el enlace o elige una criptomoneda desde Markets."
        />
        <Link to="/markets" className={buttonClassName()}>
          Volver a Markets
        </Link>
      </section>
    )
  }

  return <AssetDetailContent assetId={validAssetId} />
}

function AssetDetailContent({ assetId }: { assetId: string }) {
  const [tradeOpen, setTradeOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTimeframe = searchParams.get('timeframe')
  const timeframe: CandleTimeframe = isCandleTimeframe(requestedTimeframe)
    ? requestedTimeframe
    : '7d'
  const { quote: quoteQuery, candles } = useAssetDetailQueries(assetId, timeframe)
  const quote = quoteQuery.data?.quotes.find((item) => item.assetId === assetId)

  useEffect(() => {
    if (requestedTimeframe === timeframe) return

    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.set('timeframe', timeframe)
        return next
      },
      { replace: true },
    )
  }, [requestedTimeframe, setSearchParams, timeframe])

  function selectTimeframe(nextTimeframe: CandleTimeframe) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('timeframe', nextTimeframe)
      return next
    })
  }

  if (quoteQuery.isPending) {
    return (
      <section className="space-y-6">
        <PageHeader title="Activo" description="Cargando datos de mercado…" />
        <p role="status" className="text-sm text-fg-muted">
          Cargando cotización…
        </p>
      </section>
    )
  }

  if (!quote) {
    const error = quoteFailure(quoteQuery.error) ?? quoteQuery.data?.failures[0]?.error

    return (
      <section className="space-y-6">
        <PageHeader title="Activo no disponible" description={assetId} />
        <EmptyState
          title="No se pudo cargar la cotización"
          description={
            error
              ? describeMarketDataError(error)
              : 'Ocurrió un error inesperado al cargar los datos.'
          }
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void quoteQuery.refetch()}>Reintentar</Button>
          <Link to="/markets" className={buttonClassName()}>
            Volver a Markets
          </Link>
        </div>
      </section>
    )
  }

  const candleError =
    candles.error instanceof CandlesUnavailableError
      ? describeMarketDataError(candles.error.reason)
      : candles.error
        ? 'Ocurrió un error inesperado al cargar el historial.'
        : undefined

  return (
    <section className="space-y-6">
      <PageHeader
        title={`${quote.name} (${quote.symbol.toUpperCase()})`}
        description={`${quote.type === 'crypto' ? 'Criptomoneda' : quote.type} · ${assetId}`}
        actions={
          <Link to="/markets" className={buttonClassName()}>
            Markets
          </Link>
        }
      />

      {quoteQuery.error ? (
        <p role="status" className="text-sm text-warning">
          La última cotización no se pudo actualizar; se muestran los datos disponibles.
        </p>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="text-xs font-medium uppercase text-fg-muted">Precio actual · USD</p>
          <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-fg">
            {formatUsdPrice(quote.price)}
          </p>
        </div>
        <ChangeChip value={quote.change24hPercent} />
      </div>

      <div
        className={`grid items-start gap-4 ${tradeOpen ? 'lg:grid-cols-[minmax(0,1fr)_20rem]' : ''}`}
      >
        <Panel as="section" aria-labelledby="asset-chart-heading" className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="asset-chart-heading" className="text-lg font-semibold text-fg">
              Histórico de precio
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <TimeframeSelector value={timeframe} onChange={selectTimeframe} />
              <Button
                size="sm"
                variant={tradeOpen ? 'primary' : 'secondary'}
                className="h-9"
                aria-expanded={tradeOpen}
                aria-controls={tradeOpen ? 'asset-quick-trade' : undefined}
                leadingIcon={
                  tradeOpen ? (
                    <X aria-hidden="true" size={16} />
                  ) : (
                    <ArrowUpRight aria-hidden="true" size={16} />
                  )
                }
                onClick={() => setTradeOpen((open) => !open)}
              >
                {tradeOpen ? 'Cerrar operar' : 'Operar'}
              </Button>
            </div>
          </div>

          {candles.isPending ? (
            <p role="status" className="py-24 text-center text-sm text-fg-muted">
              Cargando velas…
            </p>
          ) : candleError ? (
            <div className="space-y-3 py-12 text-center">
              <p role="alert" className="text-sm text-warning">
                {candleError}
              </p>
              <Button onClick={() => void candles.refetch()}>Reintentar historial</Button>
            </div>
          ) : candles.data?.length ? (
            <AssetChart candles={candles.data} />
          ) : (
            <p className="py-24 text-center text-sm text-fg-muted">
              No hay velas disponibles para este periodo.
            </p>
          )}
        </Panel>

        {tradeOpen ? (
          <div id="asset-quick-trade">
            <QuickTrade quote={quote} />
          </div>
        ) : null}
      </div>

      {candles.isFetching && !candles.isPending ? (
        <p role="status" className="text-xs text-fg-muted">
          Actualizando historial…
        </p>
      ) : null}
    </section>
  )
}
