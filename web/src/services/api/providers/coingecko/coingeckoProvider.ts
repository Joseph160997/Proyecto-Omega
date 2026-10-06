import { failAll, mergeQuotesResults } from '@/application/market/quotes-result'
import { toMarketDataError } from '@/services/api/toMarketDataError'
import { COINGECKO_IDS } from '@/services/api/providers/coingecko/coingeckoCatalog'
import { mapCoinGeckoMarkets } from '@/services/api/providers/coingecko/coingeckoMapper'

import type { MarketDataProvider } from '@/application/market/ports'
import type { QuoteFailure } from '@/application/market/quotes-result'
import type { HttpClient } from '@/services/api/httpClient'

export const COINGECKO_DEFAULT_BASE_URL = 'https://api.coingecko.com/api/v3'

// CoinGecko devuelve como máximo 250 monedas por página; el catálogo es mucho menor.
const PER_PAGE = 250

export interface CoinGeckoProviderDeps {
  readonly http: HttpClient
  readonly baseUrl?: string
}

function buildMarketsUrl(baseUrl: string, coingeckoIds: readonly string[]): string {
  const params = new URLSearchParams({
    vs_currency: 'usd',
    ids: coingeckoIds.join(','),
    per_page: String(PER_PAGE),
    sparkline: 'false',
  })

  return `${baseUrl.replace(/\/+$/, '')}/coins/markets?${params.toString()}`
}

export function createCoinGeckoProvider({
  http,
  baseUrl = COINGECKO_DEFAULT_BASE_URL,
}: CoinGeckoProviderDeps): MarketDataProvider {
  return {
    async getQuotes(assetIds, options) {
      const requested = new Map<string, string>() // id de CoinGecko → assetId
      const unsupported: QuoteFailure[] = []

      for (const assetId of assetIds) {
        const coingeckoId = COINGECKO_IDS.get(assetId)

        if (coingeckoId === undefined) {
          unsupported.push({ assetId, error: { kind: 'UNSUPPORTED_ASSET', assetId } })
        } else {
          requested.set(coingeckoId, assetId)
        }
      }

      // Nada que pedir: ni siquiera se gasta una llamada del límite.
      if (requested.size === 0) return { quotes: [], failures: unsupported }

      const response = await http.getJson({
        url: buildMarketsUrl(baseUrl, [...requested.keys()]),
        signal: options?.signal,
      })

      const fetched = response.ok
        ? mapCoinGeckoMarkets(response.value, requested)
        : failAll([...requested.values()], toMarketDataError(response.error))

      return mergeQuotesResults(fetched, { quotes: [], failures: unsupported })
    },
  }
}
