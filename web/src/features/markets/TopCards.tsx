import { Link } from 'react-router-dom'

import { AssetAvatar } from '@/components/ui/AssetAvatar'
import { ChangeChip } from '@/components/ui/ChangeChip'
import { Panel } from '@/components/ui/Panel'
import { defaultMarketQuery, marketHref } from '@/features/markets/marketQueryLogic'
import { turnoverRatio } from '@/features/markets/marketStatsLogic'
import { MARKET_VIEWS, topOf } from '@/features/markets/marketViewsLogic'
import { formatCompactUsd, formatShare } from '@/lib/format'

import type { ReactNode } from 'react'
import type { MarketQuote } from '@/domain/market/quote'

// Al indexar MARKET_VIEWS, TypeScript exige que cada id exista.
const TOP_VIEW_IDS = ['gainers', 'losers', 'volume', 'active'] as const

type TopViewId = (typeof TOP_VIEW_IDS)[number]

/** El dato que cada tarjeta destaca junto a cada activo. */
const METRIC: Record<TopViewId, (quote: MarketQuote) => ReactNode> = {
  gainers: (quote) => <ChangeChip value={quote.change24hPercent} />,
  losers: (quote) => <ChangeChip value={quote.change24hPercent} />,
  volume: (quote) => (
    <span className="font-mono text-sm tabular-nums">{formatCompactUsd(quote.volume24h)}</span>
  ),
  active: (quote) => (
    <span className="font-mono text-sm tabular-nums">{formatShare(turnoverRatio(quote), 2)}</span>
  ),
}

interface TopCardsProps {
  quotes: readonly MarketQuote[]
}

export function TopCards({ quotes }: TopCardsProps) {
  return (
    <section aria-label="Tops del mercado" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {TOP_VIEW_IDS.map((viewId) => {
        const { label } = MARKET_VIEWS[viewId]
        const rows = topOf(quotes, viewId)

        return (
          <Panel key={viewId} as="article" padding="sm">
            <header className="mb-1 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">{label}</h2>

              <Link
                to={marketHref(defaultMarketQuery(viewId))}
                aria-label={`Ver todo: ${label}`}
                className="text-xs font-medium text-accent hover:underline"
              >
                Ver todo
              </Link>
            </header>

            {rows.length === 0 ? (
              <p className="py-4 text-xs text-fg-muted">Sin datos.</p>
            ) : (
              <ol className="divide-y divide-line">
                {rows.map((quote) => (
                  <li key={quote.assetId} className="flex items-center gap-3 py-2">
                    <AssetAvatar symbol={quote.symbol} imageUrl={quote.imageUrl} size={24} />
                    <span className="text-sm font-medium">{quote.symbol}</span>
                    <span className="ml-auto">{METRIC[viewId](quote)}</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        )
      })}
    </section>
  )
}
