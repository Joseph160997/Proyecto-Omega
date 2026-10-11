import { useRef, useState } from 'react'

import { AssetAvatar } from '@/components/ui/AssetAvatar'
import { ChangeChip } from '@/components/ui/ChangeChip'
import { Pagination } from '@/components/ui/Pagination'
import { Panel } from '@/components/ui/Panel'
import { SearchField } from '@/components/ui/SearchField'
import {
  DEFAULT_SORT,
  filterQuotes,
  MARKET_PAGE_SIZE,
  nextSort,
  sortQuotes,
} from '@/features/markets/marketTableLogic'
import { Sparkline } from '@/features/markets/Sparkline'
import { SortableHeader } from '@/features/markets/SortableHeader'
import { formatCompactUsd, formatUsdPrice } from '@/lib/format'
import { paginate } from '@/lib/pagination'

import type { MarketQuote } from '@/domain/market/quote'
import type { SortKey, SortState } from '@/features/markets/marketTableLogic'

interface MarketTableProps {
  quotes: readonly MarketQuote[]
}

export function MarketTable({ quotes }: MarketTableProps) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT)
  const [page, setPage] = useState(1)
  const topRef = useRef<HTMLDivElement>(null)

  const rows = sortQuotes(filterQuotes(quotes, query), sort)
  const view = paginate(rows, page, MARKET_PAGE_SIZE)

  const directionOf = (key: SortKey) => (sort.key === key ? sort.direction : null)

  const handleQueryChange = (value: string) => {
    setQuery(value)
    setPage(1)
  }

  const sortBy = (key: SortKey) => () => {
    setSort((current) => nextSort(current, key))
    setPage(1)
  }

  const goToPage = (next: number) => {
    setPage(next)
    topRef.current?.scrollIntoView({ block: 'start' })
  }

  const noun = query.trim() === '' ? 'activos' : 'coincidencias'

  return (
    <div ref={topRef} className="space-y-3">
      <SearchField
        label="Buscar por nombre o símbolo"
        placeholder="Buscar por nombre o símbolo…"
        value={query}
        onChange={handleQueryChange}
      />

      <p role="status" className="text-xs text-fg-muted">
        {view.totalItems === 0
          ? 'Sin resultados'
          : `Mostrando ${view.from}–${view.to} de ${view.totalItems} ${noun}`}
      </p>

      <Panel padding="none" className="overflow-x-auto">
        <table className="w-full min-w-[52rem] text-sm">
          <caption className="sr-only">
            Criptomonedas con precio, cambio en 24 horas, capitalización, volumen y tendencia de 7
            días
          </caption>

          <thead className="border-b border-line text-xs text-fg-muted">
            <tr>
              <SortableHeader
                label="Activo"
                direction={directionOf('name')}
                onSort={sortBy('name')}
                align="left"
              />
              <SortableHeader
                label="Precio"
                direction={directionOf('price')}
                onSort={sortBy('price')}
              />
              <SortableHeader
                label="24 h"
                direction={directionOf('change24h')}
                onSort={sortBy('change24h')}
              />
              <SortableHeader
                label="Cap. de mercado"
                direction={directionOf('marketCap')}
                onSort={sortBy('marketCap')}
              />
              <SortableHeader
                label="Volumen 24 h"
                direction={directionOf('volume24h')}
                onSort={sortBy('volume24h')}
              />
              <th scope="col" className="px-4 py-3 text-right font-medium">
                7 días
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-line">
            {view.totalItems === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-fg-muted">
                  Ningún activo coincide con «{query.trim()}».
                </td>
              </tr>
            ) : (
              view.items.map((quote) => (
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-fg-muted">
          Página {view.page} de {view.totalPages}
        </span>

        <Pagination page={view.page} totalPages={view.totalPages} onPageChange={goToPage} />
      </div>
    </div>
  )
}
