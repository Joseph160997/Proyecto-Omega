// src/features/markets/marketQueryLogic.ts
import { z } from 'zod'

import {
  FIRST_DIRECTION,
  filterQuotes,
  nextSort,
  SORT_KEYS,
  sortQuotes,
} from '@/features/markets/marketTableLogic'
import { DEFAULT_VIEW, MARKET_VIEW_IDS, MARKET_VIEWS } from '@/features/markets/marketViewsLogic'

import type { MarketQuote } from '@/domain/market/quote'
import type { SortKey, SortState } from '@/features/markets/marketTableLogic'
import type { MarketViewId } from '@/features/markets/marketViewsLogic'

export const MAX_SEARCH_LENGTH = 64
const MARKETS_PATH = '/markets'

export interface MarketQueryState {
  readonly view: MarketViewId
  /** Tal como se escribió: no se recorta, para no robarle espacios al campo mientras se teclea. */
  readonly search: string
  /** Orden efectivo: el elegido por el usuario o el de la vista. */
  readonly sort: SortState
  readonly page: number
}

export function defaultMarketQuery(view: MarketViewId = DEFAULT_VIEW): MarketQueryState {
  return { view, search: '', sort: MARKET_VIEWS[view].sort, page: 1 }
}

// La URL es entrada externa: cada campo tiene un valor de respaldo, así que parsear nunca falla.
const ParamsSchema = z.object({
  view: z.enum(MARKET_VIEW_IDS).catch(DEFAULT_VIEW),
  q: z
    .string()
    .transform((text) => text.slice(0, MAX_SEARCH_LENGTH))
    .catch(''),
  sort: z.enum(SORT_KEYS).optional().catch(undefined),
  dir: z.enum(['asc', 'desc']).optional().catch(undefined),
  page: z
    .string()
    .regex(/^\d{1,6}$/)
    .transform((digits) => Math.max(1, Number(digits)))
    .catch(1),
})

export function parseMarketQuery(params: URLSearchParams): MarketQueryState {
  const raw = ParamsSchema.parse({
    view: params.get('view'),
    q: params.get('q'),
    sort: params.get('sort'),
    dir: params.get('dir'),
    page: params.get('page'),
  })

  // Sin `sort` válido se usa el orden de la vista (y `dir` suelto se ignora).
  const sort: SortState =
    raw.sort === undefined
      ? MARKET_VIEWS[raw.view].sort
      : { key: raw.sort, direction: raw.dir ?? FIRST_DIRECTION[raw.sort] }

  return { view: raw.view, search: raw.q, sort, page: raw.page }
}

/** Lo contrario de parsear. Omite lo que es valor por defecto para mantener la URL corta. */
export function toSearchParams(state: MarketQueryState): URLSearchParams {
  const params = new URLSearchParams()
  const viewSort = MARKET_VIEWS[state.view].sort

  if (state.view !== DEFAULT_VIEW) params.set('view', state.view)
  if (state.search !== '') params.set('q', state.search)

  if (state.sort.key !== viewSort.key || state.sort.direction !== viewSort.direction) {
    params.set('sort', state.sort.key)
    params.set('dir', state.sort.direction)
  }

  if (state.page > 1) params.set('page', String(state.page))

  return params
}

export function marketHref(state: MarketQueryState): string {
  const query = toSearchParams(state).toString()

  return query === '' ? MARKETS_PATH : `${MARKETS_PATH}?${query}`
}

// --- Lo que puede hacer el usuario: cada acción devuelve el estado nuevo ---

/** Cambiar de vista: orden propio de la vista y primera página; la búsqueda se conserva. */
export function withView(state: MarketQueryState, view: MarketViewId): MarketQueryState {
  return { ...state, view, sort: MARKET_VIEWS[view].sort, page: 1 }
}

export function withSearch(state: MarketQueryState, search: string): MarketQueryState {
  return { ...state, search: search.slice(0, MAX_SEARCH_LENGTH), page: 1 }
}

export function withSort(state: MarketQueryState, key: SortKey): MarketQueryState {
  return { ...state, sort: nextSort(state.sort, key), page: 1 }
}

export function withPage(state: MarketQueryState, page: number): MarketQueryState {
  return { ...state, page: Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1 }
}

/** El recorrido completo: vista → búsqueda → orden. (La paginación va después.) */
export function selectRows(quotes: readonly MarketQuote[], state: MarketQueryState): MarketQuote[] {
  const view = MARKET_VIEWS[state.view]

  return sortQuotes(filterQuotes(quotes.filter(view.include), state.search), state.sort)
}
