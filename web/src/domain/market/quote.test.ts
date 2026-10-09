import { describe, expect, it } from 'vitest'

import { isQuoteStale, newestQuoteTimestamp, quoteAgeMs } from '@/domain/market/quote'
import { Price } from '@/domain/shared/price'

import type { Quote } from '@/domain/market/quote'

const NOW = 1_700_000_000_000

const quoteAt = (timestamp: number): Quote => ({
  assetId: 'crypto:btc',
  price: Price.of('100000'),
  timestamp,
  source: 'coingecko',
})

describe('isQuoteStale', () => {
  it('is not stale exactly at the limit', () => {
    expect(isQuoteStale(quoteAt(NOW - 60_000), NOW, 60_000)).toBe(false)
  })

  it('is stale one millisecond after the limit', () => {
    expect(isQuoteStale(quoteAt(NOW - 60_001), NOW, 60_000)).toBe(true)
  })

  it('a future quote is not considered stale', () => {
    const quote = quoteAt(NOW + 5_000)

    expect(quoteAgeMs(quote, NOW)).toBe(-5_000)
    expect(isQuoteStale(quote, NOW, 60_000)).toBe(false)
  })
})

describe('newestQuoteTimestamp', () => {
  it('returns the latest timestamp regardless of order', () => {
    expect(newestQuoteTimestamp([quoteAt(100), quoteAt(300), quoteAt(200)])).toBe(300)
  })

  it('returns undefined for an empty set', () => {
    expect(newestQuoteTimestamp([])).toBeUndefined()
  })
})
