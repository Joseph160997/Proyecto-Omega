// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MarketQuotesUnavailableError } from '@/features/markets/marketQueries'
import { Price } from '@/domain/shared/price'
import {
  assetCandlesQueryOptions,
  assetDetailKeys,
  quoteFailure,
  useAssetDetailQueries,
  CandlesUnavailableError,
  CANDLE_STALE_TIME_MS,
} from '@/features/asset-detail/assetDetailQueries'
import { makeQuote } from '@/test-utils/makeQuote'

import type { Candle } from '@/domain/market/candle'
import type { MarketDataError } from '@/application/market/errors'

const providers = vi.hoisted(() => ({ getCandles: vi.fn(), getQuotes: vi.fn() }))

vi.mock('@/app/container', () => ({
  marketCandleProvider: { getCandles: providers.getCandles },
  marketDataProvider: { getQuotes: providers.getQuotes },
}))

const quote = makeQuote('bitcoin', { assetId: 'crypto:bitcoin' })
const candle: Candle = {
  time: 1_700_000_000_000,
  open: Price.of('1'),
  high: Price.of('2'),
  low: Price.of('1'),
  close: Price.of('2'),
}

describe('asset detail query options', () => {
  it('builds a distinct query key per asset and timeframe', () => {
    expect(assetDetailKeys.candles('crypto:bitcoin', '7d')).toEqual([
      'market',
      'candles',
      'crypto:bitcoin',
      '7d',
    ])
    expect(assetDetailKeys.candles('crypto:bitcoin', '7d')).not.toEqual(
      assetDetailKeys.candles('crypto:bitcoin', '30d'),
    )
    expect(assetDetailKeys.candles('crypto:bitcoin', '7d')).not.toEqual(
      assetDetailKeys.candles('crypto:ethereum', '7d'),
    )
  })

  it('uses the candle stale time and disables retries', () => {
    const options = assetCandlesQueryOptions('crypto:bitcoin', '1d')

    expect(CANDLE_STALE_TIME_MS).toBe(15 * 60_000)
    expect(options.staleTime).toBe(CANDLE_STALE_TIME_MS)
    expect(options.retry).toBe(false)
  })

  it('passes request parameters and cancellation signal to the candle provider', async () => {
    providers.getCandles.mockResolvedValue({ ok: true, value: [candle] })
    const controller = new AbortController()
    const options = assetCandlesQueryOptions('crypto:bitcoin', '30d')

    await expect(options.queryFn({ signal: controller.signal })).resolves.toEqual([candle])
    expect(providers.getCandles).toHaveBeenCalledWith('crypto:bitcoin', '30d', {
      signal: controller.signal,
    })
  })

  it('wraps provider errors with their reason for presentation', async () => {
    const reason: MarketDataError = { kind: 'RATE_LIMIT', retryAfterMs: 1_000 }
    providers.getCandles.mockResolvedValue({ ok: false, error: reason })
    const options = assetCandlesQueryOptions('crypto:bitcoin', '7d')

    await expect(options.queryFn({ signal: new AbortController().signal })).rejects.toMatchObject({
      name: 'CandlesUnavailableError',
      reason,
    } satisfies Partial<CandlesUnavailableError>)
  })
})

describe('useAssetDetailQueries', () => {
  it('loads quotes and candles together for the requested asset and timeframe', async () => {
    providers.getCandles.mockResolvedValue({ ok: true, value: [candle] })
    providers.getQuotes.mockResolvedValue({ quotes: [quote], failures: [] })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useAssetDetailQueries('crypto:bitcoin', '1y'), { wrapper })

    await waitFor(() => {
      expect(result.current.quote.data?.quotes).toEqual([quote])
      expect(result.current.candles.data).toEqual([candle])
    })
    expect(providers.getQuotes).toHaveBeenCalledWith(['crypto:bitcoin'], expect.any(Object))
    expect(providers.getCandles).toHaveBeenCalledWith('crypto:bitcoin', '1y', expect.any(Object))
  })
})

describe('quoteFailure', () => {
  it('returns the first failure from a market quotes error', () => {
    const reason: MarketDataError = { kind: 'NETWORK_ERROR' }
    const error = new MarketQuotesUnavailableError([
      { assetId: 'crypto:bitcoin', error: reason },
      { assetId: 'crypto:ethereum', error: { kind: 'TIMEOUT' } },
    ])

    expect(quoteFailure(error)).toEqual(reason)
  })

  it('returns undefined for empty failures and unrelated errors', () => {
    expect(quoteFailure(new MarketQuotesUnavailableError([]))).toBeUndefined()
    expect(quoteFailure(new Error('unrelated'))).toBeUndefined()
    expect(quoteFailure(undefined)).toBeUndefined()
  })
})
