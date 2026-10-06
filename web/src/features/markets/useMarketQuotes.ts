import { useQuery } from '@tanstack/react-query'

import { marketDataProvider } from '@/app/container'
import { CRYPTO_CATALOG } from '@/application/market/catalog'
import { marketQuotesQueryOptions } from '@/features/markets/marketQueries'

export function useMarketQuotes(assetIds: readonly string[] = CRYPTO_CATALOG) {
  return useQuery(marketQuotesQueryOptions(marketDataProvider, assetIds))
}
