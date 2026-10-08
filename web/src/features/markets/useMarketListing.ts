import { useQuery } from '@tanstack/react-query'

import { marketListingProvider } from '@/app/container'
import { marketListingQueryOptions } from '@/features/markets/marketQueries'

export function useMarketListing(limit?: number) {
  return useQuery(marketListingQueryOptions(marketListingProvider, limit))
}
