import { turnoverRatio } from '@/features/markets/marketStatsLogic'
import { DEFAULT_SORT, sortQuotes } from '@/features/markets/marketTableLogic'
import { percentChangeDirection } from '@/lib/format'

import type { MarketQuote } from '@/domain/market/quote'
import type { SortState } from '@/features/markets/marketTableLogic'

export const MARKET_VIEW_IDS = ['all', 'gainers', 'losers', 'volume', 'active'] as const

export type MarketViewId = (typeof MARKET_VIEW_IDS)[number]

export const DEFAULT_VIEW: MarketViewId = 'all'

/** Cuántos activos muestra cada tarjeta del resumen. */
export const TOP_COUNT = 5

export interface MarketView {
  readonly id: MarketViewId
  readonly label: string
  /** Orden por defecto de la vista (el usuario puede cambiarlo). */
  readonly sort: SortState
  /** ¿Entra esta cotización en la vista? */
  readonly include: (quote: MarketQuote) => boolean
}

// Record<MarketViewId, ...> obliga a definir cada vista; añadir una es añadir un objeto.
export const MARKET_VIEWS: Record<MarketViewId, MarketView> = {
  all: {
    id: 'all',
    label: 'Todos',
    sort: DEFAULT_SORT,
    include: () => true,
  },
  gainers: {
    id: 'gainers',
    label: 'Ganadores 24 h',
    sort: { key: 'change24h', direction: 'desc' },
    include: (quote) => percentChangeDirection(quote.change24hPercent) === 'up',
  },
  losers: {
    id: 'losers',
    label: 'Perdedores 24 h',
    sort: { key: 'change24h', direction: 'asc' },
    include: (quote) => percentChangeDirection(quote.change24hPercent) === 'down',
  },
  volume: {
    id: 'volume',
    label: 'Mayor volumen',
    sort: { key: 'volume24h', direction: 'desc' },
    include: (quote) => quote.volume24h !== undefined,
  },
  active: {
    id: 'active',
    label: 'Más activas',
    sort: { key: 'activity', direction: 'desc' },
    include: (quote) => turnoverRatio(quote) !== undefined,
  },
}

/** Todas las cotizaciones de la vista, con su orden por defecto. */
export function applyView(quotes: readonly MarketQuote[], viewId: MarketViewId): MarketQuote[] {
  const view = MARKET_VIEWS[viewId]

  return sortQuotes(quotes.filter(view.include), view.sort)
}

/** Las primeras `count` de la vista: lo que muestra una tarjeta del resumen. */
export function topOf(
  quotes: readonly MarketQuote[],
  viewId: MarketViewId,
  count: number = TOP_COUNT,
): MarketQuote[] {
  return applyView(quotes, viewId).slice(0, count)
}
