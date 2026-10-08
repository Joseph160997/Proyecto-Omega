import { describe, expect, it } from 'vitest'

import { Price } from '@/domain/shared/price'
import {
  DEFAULT_SORT,
  filterQuotes,
  nextSort,
  sortQuotes,
} from '@/features/markets/marketTableLogic'

import type { MarketQuote } from '@/domain/market/quote'
import type { SortDirection, SortKey, SortState } from '@/features/markets/marketTableLogic'

function quote(
  assetId: string,
  name: string,
  price: string,
  options: Partial<
    Pick<MarketQuote, 'symbol' | 'change24hPercent' | 'marketCap' | 'volume24h'>
  > = {},
): MarketQuote {
  return {
    assetId,
    name,
    price: Price.of(price),
    timestamp: 1,
    source: 'coingecko',
    symbol: name.slice(0, 3),
    type: 'crypto',
    ...options,
  }
}

describe('nextSort', () => {
  it('defaults to market capitalization descending', () => {
    expect(DEFAULT_SORT).toEqual({ key: 'marketCap', direction: 'desc' })
  })

  it('uses the default ordering for a newly selected column', () => {
    expect(nextSort(DEFAULT_SORT, 'name')).toEqual({ key: 'name', direction: 'asc' })
    expect(nextSort(DEFAULT_SORT, 'price')).toEqual({ key: 'price', direction: 'desc' })
  })

  it.each([
    ['name', 'asc'],
    ['price', 'desc'],
    ['change24h', 'desc'],
    ['marketCap', 'desc'],
    ['volume24h', 'desc'],
  ] as Array<[SortKey, SortDirection]>)('starts a new %s column in %s order', (key, direction) => {
    const current: SortState = {
      key: key === 'name' ? 'price' : 'name',
      direction: 'asc',
    }

    expect(nextSort(current, key)).toEqual({ key, direction })
  })

  it('toggles direction when the active column is selected again', () => {
    const current: SortState = { key: 'name', direction: 'asc' }

    expect(nextSort(current, 'name')).toEqual({ key: 'name', direction: 'desc' })
  })
})

describe('filterQuotes', () => {
  const quotes = [
    quote('crypto:bitcoin', 'Bitcoin', '50000', { symbol: 'BTC' }),
    quote('crypto:ethereum', 'Ethereum', '2500', { symbol: 'ETH' }),
  ]

  it('matches name or symbol case-insensitively and trims the query', () => {
    expect(filterQuotes(quotes, '  BIT  ').map((item) => item.assetId)).toEqual(['crypto:bitcoin'])
    expect(filterQuotes(quotes, 'eth').map((item) => item.assetId)).toEqual(['crypto:ethereum'])
  })

  it('returns no matches when the query is not found', () => {
    expect(filterQuotes(quotes, 'zzz')).toEqual([])
  })

  it('returns a copy when the query is empty', () => {
    const result = filterQuotes(quotes, '  ')

    expect(result).toEqual(quotes)
    expect(result).not.toBe(quotes)
  })
})

describe('sortQuotes', () => {
  it('sorts prices numerically and leaves the input unchanged', () => {
    const quotes = [quote('crypto:nine', 'Nine', '9'), quote('crypto:ten', 'Ten', '10')]

    const result = sortQuotes(quotes, { key: 'price', direction: 'desc' })

    expect(result.map((item) => item.assetId)).toEqual(['crypto:ten', 'crypto:nine'])
    expect(quotes.map((item) => item.assetId)).toEqual(['crypto:nine', 'crypto:ten'])
  })

  it('keeps missing values last in either direction', () => {
    const quotes = [
      quote('crypto:missing', 'Missing', '1'),
      quote('crypto:low', 'Low', '1', { marketCap: 10 }),
      quote('crypto:high', 'High', '1', { marketCap: 100 }),
    ]

    expect(
      sortQuotes(quotes, { key: 'marketCap', direction: 'asc' }).map((item) => item.assetId),
    ).toEqual(['crypto:low', 'crypto:high', 'crypto:missing'])
    expect(
      sortQuotes(quotes, { key: 'marketCap', direction: 'desc' }).map((item) => item.assetId),
    ).toEqual(['crypto:high', 'crypto:low', 'crypto:missing'])
  })

  it('keeps assets without volume last when sorting in either direction', () => {
    const quotes = [
      quote('crypto:missing', 'Missing', '1'),
      quote('crypto:low', 'Low', '1', { volume24h: 10 }),
      quote('crypto:high', 'High', '1', { volume24h: 100 }),
    ]

    expect(
      sortQuotes(quotes, { key: 'volume24h', direction: 'asc' }).map((item) => item.assetId),
    ).toEqual(['crypto:low', 'crypto:high', 'crypto:missing'])
    expect(
      sortQuotes(quotes, { key: 'volume24h', direction: 'desc' }).map((item) => item.assetId),
    ).toEqual(['crypto:high', 'crypto:low', 'crypto:missing'])
  })

  it('uses asset IDs as a deterministic tie-breaker in either direction', () => {
    const quotes = [
      quote('crypto:zeta', 'Zeta', '1', { marketCap: 10 }),
      quote('crypto:alpha', 'Alpha', '1', { marketCap: 10 }),
    ]
    const expected = ['crypto:alpha', 'crypto:zeta']

    expect(
      sortQuotes(quotes, { key: 'marketCap', direction: 'desc' }).map((item) => item.assetId),
    ).toEqual(expected)
    expect(
      sortQuotes(quotes, { key: 'marketCap', direction: 'asc' }).map((item) => item.assetId),
    ).toEqual(expected)
  })

  it('sorts change percentages including negative values', () => {
    const quotes = [
      quote('crypto:negative', 'Negative', '1', { change24hPercent: -3 }),
      quote('crypto:positive', 'Positive', '1', { change24hPercent: 2 }),
      quote('crypto:flat', 'Flat', '1', { change24hPercent: 0 }),
      quote('crypto:unknown', 'Unknown', '1'),
    ]

    expect(
      sortQuotes(quotes, { key: 'change24h', direction: 'desc' }).map((item) => item.assetId),
    ).toEqual(['crypto:positive', 'crypto:flat', 'crypto:negative', 'crypto:unknown'])
  })

  it('sorts names case-insensitively in either direction', () => {
    const quotes = [
      quote('crypto:ethereum', 'ethereum', '1'),
      quote('crypto:bitcoin', 'Bitcoin', '1'),
      quote('crypto:aave', 'aave', '1'),
    ]

    expect(sortQuotes(quotes, { key: 'name', direction: 'asc' }).map((item) => item.name)).toEqual([
      'aave',
      'Bitcoin',
      'ethereum',
    ])
    expect(sortQuotes(quotes, { key: 'name', direction: 'desc' }).map((item) => item.name)).toEqual(
      ['ethereum', 'Bitcoin', 'aave'],
    )
  })

  it('does not mutate the input array', () => {
    const quotes = [quote('crypto:second', 'Second', '2'), quote('crypto:first', 'First', '1')]
    const before = quotes.map((item) => item.assetId)

    sortQuotes(quotes, { key: 'price', direction: 'asc' })

    expect(quotes.map((item) => item.assetId)).toEqual(before)
  })
})
