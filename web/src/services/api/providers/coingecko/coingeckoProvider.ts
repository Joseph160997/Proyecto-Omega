import { failAll, mergeQuotesResults } from '@/application/market/quotes-result'
import { parseAssetId } from '@/domain/market/asset'
import { err } from '@/domain/shared/result'
import {
  mapCoinGeckoListing,
  mapCoinGeckoMarkets,
} from '@/services/api/providers/coingecko/coingeckoMapper'
import { toMarketDataError } from '@/services/api/toMarketDataError'

import type { MarketDataProvider, MarketListingProvider } from '@/application/market/ports'
import type { QuoteFailure } from '@/application/market/quotes-result'
import type { HttpClient } from '@/services/api/httpClient'

export const COINGECKO_DEFAULT_BASE_URL = 'https://api.coingecko.com/api/v3'

// CoinGecko devuelve como máximo 250 monedas por página.
export const COINGECKO_MAX_PER_PAGE = 250

export interface CoinGeckoProviderDeps {
  readonly http: HttpClient
  readonly baseUrl?: string
}

function marketsUrl(baseUrl: string, params: Record<string, string>): string {
  const query = new URLSearchParams({ vs_currency: 'usd', sparkline: 'false', ...params })

  return `${baseUrl.replace(/\/+$/, '')}/coins/markets?${query.toString()}`
}

/** assetId → id de CoinGecko, o undefined si no es una cripto bien formada. */
function toCoinGeckoId(assetId: string): string | undefined {
  const parsed = parseAssetId(assetId)

  return parsed.ok && parsed.value.type === 'crypto' ? parsed.value.key : undefined
}

export function createCoinGeckoProvider({
  http,
  baseUrl = COINGECKO_DEFAULT_BASE_URL,
}: CoinGeckoProviderDeps): MarketDataProvider & MarketListingProvider {
  return {
    async getQuotes(assetIds, options) {
      const requested = new Map<string, string>() // id de CoinGecko → assetId
      const unsupported: QuoteFailure[] = []

      for (const assetId of assetIds) {
        const coingeckoId = toCoinGeckoId(assetId)

        if (coingeckoId === undefined) {
          unsupported.push({ assetId, error: { kind: 'UNSUPPORTED_ASSET', assetId } })
        } else {
          requested.set(coingeckoId, assetId)
        }
      }

      // Nada que pedir: ni siquiera se gasta una llamada del límite.
      if (requested.size === 0) return { quotes: [], failures: unsupported }

      const response = await http.getJson({
        url: marketsUrl(baseUrl, {
          ids: [...requested.keys()].join(','),
          per_page: String(COINGECKO_MAX_PER_PAGE),
        }),
        signal: options?.signal,
      })

      const fetched = response.ok
        ? mapCoinGeckoMarkets(response.value, requested)
        : failAll([...requested.values()], toMarketDataError(response.error))

      return mergeQuotesResults(fetched, { quotes: [], failures: unsupported })
    },

    async listTop(limit, options) {
      if (!Number.isInteger(limit) || limit < 1 || limit > COINGECKO_MAX_PER_PAGE) {
        throw new RangeError(`limit debe ser un entero entre 1 y ${COINGECKO_MAX_PER_PAGE}`)
      }

      const response = await http.getJson({
        url: marketsUrl(baseUrl, {
          order: 'market_cap_desc',
          per_page: String(limit),
          page: '1',
          sparkline: 'true',
        }),
        signal: options?.signal,
      })

      return response.ok
        ? mapCoinGeckoListing(response.value)
        : err(toMarketDataError(response.error))
    },
  }
}
