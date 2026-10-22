import { useQuery } from '@tanstack/react-query'

import { marketCandleProvider, marketDataProvider } from '@/app/container'
import {
  MarketQuotesUnavailableError,
  marketQuotesQueryOptions,
} from '@/features/markets/marketQueries'

import type { MarketDataError } from '@/application/market/errors'
import type { CandleTimeframe } from '@/domain/market/candleTimeframe'

export const CANDLE_STALE_TIME_MS = 15 * 60_000

export const assetDetailKeys = {
  candles: (assetId: string, timeframe: CandleTimeframe) =>
    ['market', 'candles', assetId, timeframe] as const,
}

export class CandlesUnavailableError extends Error {
  readonly reason: MarketDataError

  constructor(reason: MarketDataError) {
    super(`No se pudieron obtener las velas (${reason.kind})`)
    this.name = 'CandlesUnavailableError'
    this.reason = reason
  }
}

export function assetCandlesQueryOptions(assetId: string, timeframe: CandleTimeframe) {
  return {
    queryKey: assetDetailKeys.candles(assetId, timeframe),
    queryFn: async ({ signal }: { signal: AbortSignal }) => {
      const result = await marketCandleProvider.getCandles(assetId, timeframe, { signal })

      if (!result.ok) throw new CandlesUnavailableError(result.error)

      return result.value
    },
    staleTime: CANDLE_STALE_TIME_MS,
    retry: false,
  } as const
}

export function useAssetDetailQueries(assetId: string, timeframe: CandleTimeframe) {
  const quote = useQuery({
    ...marketQuotesQueryOptions(marketDataProvider, [assetId]),
    staleTime: 60_000,
  })
  const candles = useQuery(assetCandlesQueryOptions(assetId, timeframe))

  return { quote, candles }
}

export function quoteFailure(error: unknown): MarketDataError | undefined {
  return error instanceof MarketQuotesUnavailableError ? error.failures[0]?.error : undefined
}
