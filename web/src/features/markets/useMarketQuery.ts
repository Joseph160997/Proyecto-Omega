import { useSearchParams } from 'react-router-dom'

import {
  parseMarketQuery,
  toSearchParams,
  withPage,
  withSearch,
  withSort,
} from '@/features/markets/marketQueryLogic'

import type { MarketQueryState } from '@/features/markets/marketQueryLogic'
import type { SortKey } from '@/features/markets/marketTableLogic'

/** El estado de Markets vive en la URL; este hook ofrece las acciones del usuario. */
export function useMarketQuery() {
  const [params, setParams] = useSearchParams()
  const state = parseMarketQuery(params)

  const apply = (next: MarketQueryState, options?: { replace?: boolean }) => {
    setParams(toSearchParams(next), options)
  }

  return {
    state,
    // Escribir no debe llenar el historial: cada tecla reemplaza la entrada actual.
    setSearch: (text: string) => apply(withSearch(state, text), { replace: true }),
    sortBy: (key: SortKey) => apply(withSort(state, key)),
    goToPage: (page: number) => apply(withPage(state, page)),
  }
}
