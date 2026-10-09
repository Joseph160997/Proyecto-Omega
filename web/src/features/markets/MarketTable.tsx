import { useId, useState } from 'react'

import { ChangeIndicator } from '@/features/markets/ChangeIndicator'
import { Sparkline } from '@/features/markets/Sparkline'
import {
  DEFAULT_SORT,
  filterQuotes,
  MARKET_PAGE_SIZE,
  nextSort,
  sortQuotes,
} from '@/features/markets/marketTableLogic'
import { SortableHeader } from '@/features/markets/SortableHeader'
import { formatCompactUsd, formatUsdPrice } from '@/lib/format'

import type { MarketQuote } from '@/domain/market/quote'
import type { SortKey, SortState } from '@/features/markets/marketTableLogic'

interface MarketTableProps {
  quotes: readonly MarketQuote[]
}

export function MarketTable({ quotes }: MarketTableProps) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT)
  const [visibleCount, setVisibleCount] = useState(MARKET_PAGE_SIZE)
  const searchId = useId()

  const rows = sortQuotes(filterQuotes(quotes, query), sort)
  const visibleRows = rows.slice(0, visibleCount)
  const remaining = rows.length - visibleRows.length

  const directionOf = (key: SortKey) => (sort.key === key ? sort.direction : null)
  const handleQueryChange = (value: string) => {
    setQuery(value)
    setVisibleCount(MARKET_PAGE_SIZE)
  }

  const sortBy = (key: SortKey) => () => {
    setSort((current) => nextSort(current, key))
    setVisibleCount(MARKET_PAGE_SIZE)
  }

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={searchId} className="sr-only">
          Buscar por nombre o símbolo
        </label>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          placeholder="Buscar por nombre o símbolo…"
          className="w-full max-w-sm rounded-lg border border-(--border) bg-(--surface) px-3 py-2 text-sm placeholder:text-(--text-secondary)"
        />
      </div>

      <p role="status" className="text-xs text-(--text-secondary)">
        {visibleRows.length} de {rows.length} {query.trim() === '' ? 'activos' : 'coincidencias'}
      </p>

      <div className="overflow-x-auto rounded-2xl border border-(--border) bg-(--surface)">
        <table className="w-full min-w-208 text-sm">
          <caption className="sr-only">
            Criptomonedas con precio, cambio en 24 horas, capitalización, volumen y tendencia de 7
            días
          </caption>

          <thead className="border-b border-(--border) text-xs text-(--text-secondary)">
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

          <tbody className="divide-y divide-(--border)">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-(--text-secondary)">
                  Ningún activo coincide con «{query.trim()}».
                </td>
              </tr>
            ) : (
              visibleRows.map((quote) => (
                <tr key={quote.assetId}>
                  <th scope="row" className="px-4 py-3 text-left font-medium">
                    {quote.name} <span className="text-(--text-secondary)">{quote.symbol}</span>
                  </th>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {formatUsdPrice(quote.price)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChangeIndicator value={quote.change24hPercent} />
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
      </div>

      {remaining > 0 ? (
        <button
          type="button"
          onClick={() => setVisibleCount((current) => current + MARKET_PAGE_SIZE)}
          className="rounded-lg border border-(--border) px-4 py-2 text-sm text-(--text-secondary) transition-colors hover:text-(--text-primary)"
        >
          Mostrar {Math.min(MARKET_PAGE_SIZE, remaining)} más ({remaining} restantes)
        </button>
      ) : null}
    </div>
  )
}
