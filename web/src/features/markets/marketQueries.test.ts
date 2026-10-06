import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import { failAll } from '@/application/market/quotes-result'
import { Price } from '@/domain/shared/price'
import {
  marketKeys,
  MarketQuotesUnavailableError,
  marketQuotesQueryOptions,
} from '@/features/markets/marketQueries'

import type { MarketDataProvider } from '@/application/market/ports'
import type { QuotesResult } from '@/application/market/quotes-result'
import type { MarketQuote } from '@/domain/market/quote'

const quote = (assetId: string): MarketQuote => ({
  assetId,
  price: Price.of('100'),
  timestamp: 1_700_000_000_000,
  source: 'coingecko',
  symbol: assetId.split(':')[1] ?? assetId,
  name: assetId,
  type: 'crypto',
})

/** Fake provider: returns the supplied result and records each call. */
function fakeProvider(result: QuotesResult) {
  const calls: Array<{ ids: readonly string[]; signal?: AbortSignal }> = []

  const provider: MarketDataProvider = {
    async getQuotes(ids, options) {
      calls.push({ ids, signal: options?.signal })
      return result
    },
  }

  return { provider, calls }
}

const newClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

describe('marketKeys.quotes', () => {
  it('does not depend on order or duplicate IDs', () => {
    expect(marketKeys.quotes(['b', 'a', 'a'])).toEqual(marketKeys.quotes(['a', 'b']))
  })
})

describe('marketQuotesQueryOptions', () => {
  it('returns the provider result', async () => {
    const result: QuotesResult = { quotes: [quote('crypto:btc')], failures: [] }
    const { provider } = fakeProvider(result)

    const data = await newClient().fetchQuery(marketQuotesQueryOptions(provider, ['crypto:btc']))

    expect(data).toEqual(result)
  })

  it('keeps partial failures in the result instead of treating them as an error', async () => {
    const result: QuotesResult = {
      quotes: [quote('crypto:btc')],
      failures: [{ assetId: 'crypto:eth', error: { kind: 'TIMEOUT' } }],
    }
    const { provider } = fakeProvider(result)

    const data = await newClient().fetchQuery(
      marketQuotesQueryOptions(provider, ['crypto:btc', 'crypto:eth']),
    )

    expect(data).toEqual(result)
  })

  it('throws MarketQuotesUnavailableError when all quotes fail and exposes the failures', async () => {
    const failed = failAll(['crypto:btc'], { kind: 'RATE_LIMIT' })
    const { provider } = fakeProvider(failed)

    const error = await newClient()
      .fetchQuery(marketQuotesQueryOptions(provider, ['crypto:btc']))
      .catch((cause: unknown) => cause)

    expect(error).toBeInstanceOf(MarketQuotesUnavailableError)
    expect((error as MarketQuotesUnavailableError).failures).toEqual(failed.failures)
  })

  it('treats an empty request as a successful result', async () => {
    const { provider } = fakeProvider({ quotes: [], failures: [] })

    const data = await newClient().fetchQuery(marketQuotesQueryOptions(provider, []))

    expect(data).toEqual({ quotes: [], failures: [] })
  })

  it('deduplicates IDs before calling the provider', async () => {
    const { provider, calls } = fakeProvider({ quotes: [quote('crypto:btc')], failures: [] })

    await newClient().fetchQuery(
      marketQuotesQueryOptions(provider, ['crypto:btc', 'crypto:btc', 'crypto:eth']),
    )

    expect(calls[0]?.ids).toEqual(['crypto:btc', 'crypto:eth'])
  })

  it('passes an abort signal to the provider', async () => {
    const { provider, calls } = fakeProvider({ quotes: [quote('crypto:btc')], failures: [] })

    await newClient().fetchQuery(marketQuotesQueryOptions(provider, ['crypto:btc']))

    expect(calls[0]?.signal).toBeInstanceOf(AbortSignal)
  })
})
