import { describe, expect, it } from 'vitest'

import { answersExactly, failAll, mergeQuotesResults } from '@/application/market/quotes-result'
import { Price } from '@/domain/shared/price'

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

describe('failAll', () => {
  it('marks each id with the same cause', () => {
    const result = failAll(['crypto:btc', 'crypto:eth'], { kind: 'TIMEOUT' })

    expect(result.quotes).toEqual([])
    expect(result.failures).toEqual([
      { assetId: 'crypto:btc', error: { kind: 'TIMEOUT' } },
      { assetId: 'crypto:eth', error: { kind: 'TIMEOUT' } },
    ])
  })

  it('with no ids, it produces no failures', () => {
    expect(failAll([], { kind: 'NETWORK_ERROR' })).toEqual({ quotes: [], failures: [] })
  })
})

describe('mergeQuotesResults', () => {
  it('concatenates quotes and failures from disjoint sets', () => {
    const a: QuotesResult = { quotes: [quote('crypto:btc')], failures: [] }
    const b = failAll(['stock:aapl'], { kind: 'RATE_LIMIT', retryAfterMs: 30_000 })

    const merged = mergeQuotesResults(a, b)

    expect(merged.quotes.map((q) => q.assetId)).toEqual(['crypto:btc'])
    expect(merged.failures).toEqual([
      { assetId: 'stock:aapl', error: { kind: 'RATE_LIMIT', retryAfterMs: 30_000 } },
    ])
  })

  it('without arguments, it returns an empty result', () => {
    expect(mergeQuotesResults()).toEqual({ quotes: [], failures: [] })
  })
})

describe('answersExactly', () => {
  const mixed: QuotesResult = {
    quotes: [quote('crypto:btc')],
    failures: [{ assetId: 'stock:aapl', error: { kind: 'TIMEOUT' } }],
  }

  it('accepts a result that covers all ids regardless of order', () => {
    expect(answersExactly(mixed, ['stock:aapl', 'crypto:btc'])).toBe(true)
  })

  it('rejects if an id is missing', () => {
    expect(answersExactly(mixed, ['crypto:btc', 'stock:aapl', 'crypto:eth'])).toBe(false)
  })

  it('rejects if there is an extra id that was not requested', () => {
    expect(answersExactly(mixed, ['crypto:btc'])).toBe(false)
  })

  it('rejects if an id appears twice (quote and failure)', () => {
    const duplicated: QuotesResult = {
      quotes: [quote('crypto:btc')],
      failures: [{ assetId: 'crypto:btc', error: { kind: 'TIMEOUT' } }],
    }

    expect(answersExactly(duplicated, ['crypto:btc'])).toBe(false)
  })

  it('an empty request with an empty result is valid', () => {
    expect(answersExactly({ quotes: [], failures: [] }, [])).toBe(true)
  })
})
