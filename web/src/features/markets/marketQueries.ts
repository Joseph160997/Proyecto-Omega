import { queryOptions } from '@tanstack/react-query'

import type { MarketDataError } from '@/application/market/errors'
import type { MarketDataProvider, MarketListingProvider } from '@/application/market/ports'
import type { MarketListing, QuoteFailure, QuotesResult } from '@/application/market/quotes-result'

export const MARKET_REFRESH_MS = 120_000
export const MARKET_LISTING_SIZE = 250

/**
 * Ninguna cotización llegó. Como TanStack Query trata esto como error,
 * conserva los últimos datos buenos mientras la UI muestra el aviso.
 */
export class MarketQuotesUnavailableError extends Error {
  readonly failures: readonly QuoteFailure[]

  constructor(failures: readonly QuoteFailure[]) {
    super('No se pudo obtener ninguna cotización')
    this.name = 'MarketQuotesUnavailableError'
    this.failures = failures
  }
}

/** El listado completo falló. Conserva la causa para que la UI la traduzca. */
export class MarketListingUnavailableError extends Error {
  readonly reason: MarketDataError

  constructor(reason: MarketDataError) {
    super(`No se pudo obtener el listado de mercado (${reason.kind})`)
    this.name = 'MarketListingUnavailableError'
    this.reason = reason
  }
}

export const marketKeys = {
  all: ['market'] as const,
  /** La clave no depende del orden ni de repetidos. */
  quotes: (assetIds: readonly string[]) =>
    ['market', 'quotes', [...new Set(assetIds)].sort()] as const,
  listing: (limit: number) => ['market', 'listing', limit] as const,
}

export function marketQuotesQueryOptions(
  provider: MarketDataProvider,
  assetIds: readonly string[],
) {
  // El contrato del puerto exige ids sin duplicados: aquí es donde se garantiza.
  const ids = [...new Set(assetIds)]

  return queryOptions({
    queryKey: marketKeys.quotes(ids),

    queryFn: async ({ signal }): Promise<QuotesResult> => {
      const result = await provider.getQuotes(ids, { signal })

      if (result.quotes.length === 0 && result.failures.length > 0) {
        throw new MarketQuotesUnavailableError(result.failures)
      }

      return result
    },

    refetchInterval: MARKET_REFRESH_MS,
    // Reintentar un 429 de inmediato lo empeora; el siguiente ciclo ya reintenta.
    retry: false,
  })
}

export function marketListingQueryOptions(
  provider: MarketListingProvider,
  limit: number = MARKET_LISTING_SIZE,
) {
  return queryOptions({
    queryKey: marketKeys.listing(limit),

    queryFn: async ({ signal }): Promise<MarketListing> => {
      const result = await provider.listTop(limit, { signal })

      if (!result.ok) throw new MarketListingUnavailableError(result.error)

      return result.value
    },

    refetchInterval: MARKET_REFRESH_MS,
    retry: false,
  })
}
