import { useQuery } from '@tanstack/react-query'

import { marketListingProvider } from '@/app/container'
import { newestQuoteTimestamp } from '@/domain/market/quote'
import { deriveDataStatus } from '@/features/markets/marketDataStatus'
import { marketListingQueryOptions } from '@/features/markets/marketQueries'
import { useNow } from '@/hooks/useNow'

import type { DataStatus } from '@/features/markets/marketDataStatus'

/** Observa el estado de la caché de mercado sin iniciar solicitudes propias. */
export function useMarketDataStatus(): DataStatus {
  const { data, isFetching, isError } = useQuery({
    ...marketListingQueryOptions(marketListingProvider),
    enabled: false,
  })
  const now = useNow()

  return deriveDataStatus({
    isFetching,
    isError,
    newestTimestamp: data ? newestQuoteTimestamp(data.quotes) : undefined,
    now,
  })
}
