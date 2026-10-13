import { useEffect, useRef, useState } from 'react'
import { useNavigationType } from 'react-router-dom'

import { Pagination } from '@/components/ui/Pagination'
import { PillNav } from '@/components/ui/PillNav'
import { SearchField } from '@/components/ui/SearchField'
import { MarketTable } from '@/features/markets/MarketTable'
import {
  MAX_SEARCH_LENGTH,
  marketHref,
  selectRows,
  withView,
} from '@/features/markets/marketQueryLogic'
import { summarize } from '@/features/markets/marketStatsLogic'
import { MARKET_PAGE_SIZE } from '@/features/markets/marketTableLogic'
import { DEFAULT_VIEW, MARKET_VIEW_IDS, MARKET_VIEWS } from '@/features/markets/marketViewsLogic'
import { SummaryStrip } from '@/features/markets/SummaryStrip'
import { TopCards } from '@/features/markets/TopCards'
import { useMarketQuery } from '@/features/markets/useMarketQuery'
import { paginate } from '@/lib/pagination'

import type { MarketQuote } from '@/domain/market/quote'

interface MarketExplorerProps {
  quotes: readonly MarketQuote[]
}

export function MarketExplorer({ quotes }: MarketExplorerProps) {
  const { state, setSearch, sortBy, goToPage } = useMarketQuery()
  const navigationType = useNavigationType()
  const tableTopRef = useRef<HTMLDivElement>(null)

  // El campo mantiene su borrador local mientras la URL se actualiza en una transición.
  const [draft, setDraft] = useState(state.search)

  // Si la URL cambia por Atrás u otro enlace, sincroniza el campo con la búsqueda nueva.
  useEffect(() => {
    if (navigationType !== 'REPLACE') setDraft(state.search)
  }, [navigationType, state.search])

  const handleSearch = (text: string) => {
    const limited = text.slice(0, MAX_SEARCH_LENGTH)

    setDraft(limited)
    setSearch(limited)
  }

  const handlePageChange = (page: number) => {
    goToPage(page)
    tableTopRef.current?.scrollIntoView({ block: 'start' })
  }

  // Vista, búsqueda, orden y paginación se derivan de las cotizaciones y la URL.
  const rows = selectRows(quotes, state)
  const view = paginate(rows, state.page, MARKET_PAGE_SIZE)
  const isSearching = state.search.trim() !== ''
  const showTops = state.view === DEFAULT_VIEW && !isSearching && view.page === 1

  const viewLinks = MARKET_VIEW_IDS.map((id) => ({
    id,
    label: MARKET_VIEWS[id].label,
    to: marketHref(withView(state, id)),
  }))

  return (
    <div className="space-y-6">
      <SummaryStrip summary={summarize(quotes)} />

      {showTops ? <TopCards quotes={quotes} /> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PillNav label="Vistas del mercado" items={viewLinks} currentId={state.view} />

        <SearchField
          label="Buscar por nombre o símbolo"
          placeholder="Buscar por nombre o símbolo…"
          value={draft}
          onChange={handleSearch}
        />
      </div>

      <div ref={tableTopRef} className="space-y-3">
        <h2 className="sr-only">Listado de activos</h2>

        <p role="status" className="text-xs text-fg-muted">
          {view.totalItems === 0
            ? 'Sin resultados'
            : `Mostrando ${view.from}–${view.to} de ${view.totalItems} ${isSearching ? 'coincidencias' : 'activos'}`}
        </p>

        <MarketTable
          rows={view.items}
          sort={state.sort}
          onSort={sortBy}
          emptyMessage={
            isSearching
              ? `Ningún activo coincide con «${state.search.trim()}».`
              : 'No hay activos en esta vista.'
          }
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-fg-muted">
            Página {view.page} de {view.totalPages}
          </span>

          <Pagination
            page={view.page}
            totalPages={view.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  )
}
