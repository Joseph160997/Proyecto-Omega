import { useId, useState } from 'react'

import { ChangeIndicator } from '@/features/markets/ChangeIndicator'
import {
  DEFAULT_SORT,
  filterQuotes,
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
  const searchId = useId()

  const rows = sortQuotes(filterQuotes(quotes, query), sort)

  const directionOf = (key: SortKey) => (sort.key === key ? sort.direction : null)
  const sortBy = (key: SortKey) => () => setSort((current) => nextSort(current, key))

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
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre o símbolo…"
          className="w-full max-w-sm rounded-lg border border-(--border) bg-(--surface) px-3 py-2 text-sm placeholder:text-(--text-secondary)"
        />
      </div>

      <p role="status" className="text-xs text-(--text-secondary)">
        {rows.length === quotes.length
          ? `${rows.length} activos`
          : `${rows.length} de ${quotes.length} activos`}
      </p>

      <div className="overflow-x-auto rounded-2xl border border-(--border) bg-(--surface)">
        <table className="w-full min-w-176 text-sm">
          <caption className="sr-only">
            Criptomonedas con precio, cambio en 24 horas, capitalización y volumen
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
            </tr>
          </thead>

          <tbody className="divide-y divide-(--border)">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-(--text-secondary)">
                  Ningún activo coincide con «{query.trim()}».
                </td>
              </tr>
            ) : (
              rows.map((quote) => (
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
