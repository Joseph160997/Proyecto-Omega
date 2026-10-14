import { AssetAvatar } from '@/components/ui/AssetAvatar'
import { ChangeChip } from '@/components/ui/ChangeChip'
import { Panel } from '@/components/ui/Panel'
import { turnoverRatio } from '@/features/markets/marketStatsLogic'
import { Sparkline } from '@/features/markets/Sparkline'
import { SortableHeader } from '@/features/markets/SortableHeader'
import { formatCompactUsd, formatShare, formatUsdPrice } from '@/lib/format'

import type { MarketQuote } from '@/domain/market/quote'
import type { SortKey, SortState } from '@/features/markets/marketTableLogic'

interface MarketTableProps {
  /** Solo las filas de la página actual: la tabla no filtra, ordena ni pagina. */
  rows: readonly MarketQuote[]
  sort: SortState
  onSort: (key: SortKey) => void
  emptyMessage: string
}

export function MarketTable({ rows, sort, onSort, emptyMessage }: MarketTableProps) {
  const directionOf = (key: SortKey) => (sort.key === key ? sort.direction : null)

  return (
    <Panel padding="none" className="overflow-x-auto">
      <table className="w-full min-w-232 text-sm">
        <caption className="sr-only">
          Criptomonedas con precio, cambio en 24 horas, capitalización, volumen, actividad y
          tendencia de 7 días
        </caption>

        <thead className="border-b border-line text-xs text-fg-muted">
          <tr>
            <SortableHeader
              label="Activo"
              direction={directionOf('name')}
              onSort={() => onSort('name')}
              align="left"
            />
            <SortableHeader
              label="Precio"
              direction={directionOf('price')}
              onSort={() => onSort('price')}
            />
            <SortableHeader
              label="24 h"
              direction={directionOf('change24h')}
              onSort={() => onSort('change24h')}
            />
            <SortableHeader
              label="Cap. de mercado"
              direction={directionOf('marketCap')}
              onSort={() => onSort('marketCap')}
            />
            <SortableHeader
              label="Volumen 24 h"
              direction={directionOf('volume24h')}
              onSort={() => onSort('volume24h')}
            />
            <SortableHeader
              label="Vol./Cap."
              direction={directionOf('activity')}
              onSort={() => onSort('activity')}
            />
            <th scope="col" className="px-4 py-3 text-right font-medium">
              7 días
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-line">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-fg-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((quote) => (
              <tr key={quote.assetId} className="transition-colors hover:bg-raised">
                <th scope="row" className="px-4 py-3 text-left font-medium">
                  <div className="flex items-center gap-3">
                    <AssetAvatar symbol={quote.symbol} imageUrl={quote.imageUrl} />
                    <span>
                      {quote.name} <span className="text-fg-muted">{quote.symbol}</span>
                    </span>
                  </div>
                </th>
                <td className="px-4 py-3 text-right font-mono tabular-nums">
                  {formatUsdPrice(quote.price)}
                </td>
                <td className="px-4 py-3 text-right">
                  <ChangeChip value={quote.change24hPercent} />
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">
                  {formatCompactUsd(quote.marketCap)}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">
                  {formatCompactUsd(quote.volume24h)}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">
                  {formatShare(turnoverRatio(quote), 2)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <Sparkline values={quote.sparkline7d} />
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Panel>
  )
}
