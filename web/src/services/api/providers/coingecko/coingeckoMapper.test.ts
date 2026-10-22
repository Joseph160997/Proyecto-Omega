import { describe, expect, it } from 'vitest'

import { answersExactly } from '@/application/market/quotes-result'
import {
  mapCoinGeckoListing,
  mapCoinGeckoMarkets,
  mapCoinGeckoOhlc,
} from '@/services/api/providers/coingecko/coingeckoMapper'
import { COINGECKO_MARKETS_FIXTURE } from '@/services/api/providers/coingecko/coingeckoMarkets.fixture'

const ALL = new Map([
  ['bitcoin', 'crypto:btc'],
  ['ethereum', 'crypto:eth'],
  ['solana', 'crypto:sol'],
])
const ONLY_BTC = new Map([['bitcoin', 'crypto:btc']])
const BTC_AND_ETH = new Map([
  ['bitcoin', 'crypto:btc'],
  ['ethereum', 'crypto:eth'],
])

const fixtureItems = COINGECKO_MARKETS_FIXTURE as Array<Record<string, unknown>>
const [bitcoin = {}, ethereum = {}] = fixtureItems

const bitcoinWith = (overrides: Record<string, unknown>) => [{ ...bitcoin, ...overrides }]

describe('with the real CoinGecko response', () => {
  const result = mapCoinGeckoMarkets(COINGECKO_MARKETS_FIXTURE, ALL)

  it('maps all three coins without failures', () => {
    expect(result.quotes).toHaveLength(3)
    expect(result.failures).toEqual([])
  })

  it('meets the provider contract', () => {
    expect(answersExactly(result, [...ALL.values()])).toBe(true)
  })

  it('maps all Bitcoin fields', () => {
    const btc = result.quotes.find((quote) => quote.assetId === 'crypto:btc')

    expect(btc).toMatchObject({
      assetId: 'crypto:btc',
      symbol: 'BTC',
      name: 'Bitcoin',
      type: 'crypto',
      source: 'coingecko',
      timestamp: Date.parse('2026-10-06T21:42:20.000Z'),
      change24hPercent: -0.36434,
      volume24h: 27330667563,
      marketCap: 1719979725824,
    })
    expect(btc?.price.toString()).toBe('85591')
  })

  it('preserves price decimals', () => {
    const eth = result.quotes.find((quote) => quote.assetId === 'crypto:eth')

    expect(eth?.price.toString()).toBe('2696.46')
  })
})

describe('tolerance', () => {
  it('ignores unknown fields', () => {
    const result = mapCoinGeckoMarkets(bitcoinWith({ campo_nuevo: { x: 1 } }), ONLY_BTC)

    expect(result.quotes).toHaveLength(1)
  })

  it('null optional fields become undefined', () => {
    const result = mapCoinGeckoMarkets(
      bitcoinWith({ market_cap: null, total_volume: null, price_change_percentage_24h: null }),
      ONLY_BTC,
    )
    const quote = result.quotes[0]

    expect(quote).toBeDefined()
    expect(quote?.marketCap).toBeUndefined()
    expect(quote?.volume24h).toBeUndefined()
    expect(quote?.change24hPercent).toBeUndefined()
  })
})

describe('invalid data for one coin', () => {
  it.each([
    ['null price', { current_price: null }],
    ['negative price', { current_price: -1 }],
    ['out-of-range price', { current_price: 1e12 }],
    ['price as string', { current_price: '85591' }],
    ['missing date', { last_updated: undefined }],
    ['garbage date', { last_updated: 'ayer' }],
    ['ambiguous date', { last_updated: '1' }],
    ['empty symbol', { symbol: '' }],
  ])('%s → INVALID_RESPONSE for that coin', (_label, overrides) => {
    const result = mapCoinGeckoMarkets(bitcoinWith(overrides), ONLY_BTC)

    expect(result.quotes).toEqual([])
    expect(result.failures).toEqual([
      { assetId: 'crypto:btc', error: { kind: 'INVALID_RESPONSE' } },
    ])
  })

  it('an invalid coin does not drag down the others', () => {
    const result = mapCoinGeckoMarkets([{ ...bitcoin, current_price: null }, ethereum], BTC_AND_ETH)

    expect(result.quotes.map((quote) => quote.assetId)).toEqual(['crypto:eth'])
    expect(result.failures).toEqual([
      { assetId: 'crypto:btc', error: { kind: 'INVALID_RESPONSE' } },
    ])
  })
})

describe('unexpected response shape', () => {
  it.each([[{ status: { error_code: 429 } }], ['text'], [null], [42]])(
    'not an array (%j): all fail with INVALID_RESPONSE',
    (body) => {
      const result = mapCoinGeckoMarkets(body, ALL)

      expect(result.quotes).toEqual([])
      expect(result.failures).toHaveLength(3)
      expect(result.failures.every((f) => f.error.kind === 'INVALID_RESPONSE')).toBe(true)
      expect(answersExactly(result, [...ALL.values()])).toBe(true)
    },
  )

  it('a requested coin that is missing from the response is UNSUPPORTED_ASSET', () => {
    const result = mapCoinGeckoMarkets([bitcoin], BTC_AND_ETH)

    expect(result.failures).toEqual([
      { assetId: 'crypto:eth', error: { kind: 'UNSUPPORTED_ASSET', assetId: 'crypto:eth' } },
    ])
    expect(answersExactly(result, [...BTC_AND_ETH.values()])).toBe(true)
  })

  it('ignores coins that were not requested', () => {
    const result = mapCoinGeckoMarkets(COINGECKO_MARKETS_FIXTURE, ONLY_BTC)

    expect(result.quotes.map((quote) => quote.assetId)).toEqual(['crypto:btc'])
    expect(result.failures).toEqual([])
  })

  it('an item without an id is ignored and the coin remains unsupported', () => {
    const result = mapCoinGeckoMarkets(bitcoinWith({ id: undefined }), ONLY_BTC)

    expect(result.quotes).toEqual([])
    expect(result.failures[0]?.error.kind).toBe('UNSUPPORTED_ASSET')
  })

  it('if a coin arrives more than once, the first one wins', () => {
    const result = mapCoinGeckoMarkets([bitcoin, { ...bitcoin, current_price: 1 }], ONLY_BTC)

    expect(result.quotes).toHaveLength(1)
    expect(result.quotes[0]?.price.toString()).toBe('85591')
  })

  it('an impostor with the same symbol does not replace the requested coin', () => {
    const impostor = {
      ...bitcoin,
      id: 'wrapped-bitcoin',
      name: 'Wrapped Bitcoin',
      current_price: 1,
    }

    const result = mapCoinGeckoMarkets([impostor, bitcoin], ONLY_BTC)

    expect(result.quotes).toHaveLength(1)
    expect(result.quotes[0]?.name).toBe('Bitcoin')
    expect(result.quotes[0]?.price.toString()).toBe('85591')
  })
})
describe('mapCoinGeckoListing', () => {
  it('maps the real response using CoinGecko IDs as canonical asset IDs', () => {
    const result = mapCoinGeckoListing(COINGECKO_MARKETS_FIXTURE)

    expect(result.ok && result.value.quotes.map((quote) => quote.assetId)).toEqual([
      'crypto:bitcoin',
      'crypto:ethereum',
      'crypto:solana',
    ])
    expect(result.ok && result.value.skipped).toBe(0)
  })

  it('skips invalid coins and counts them', () => {
    const result = mapCoinGeckoListing([{ ...bitcoin, current_price: null }, ethereum])

    expect(result.ok && result.value.quotes.map((quote) => quote.assetId)).toEqual([
      'crypto:ethereum',
    ])
    expect(result.ok && result.value.skipped).toBe(1)
  })

  it.each([
    ['missing ID', { id: undefined }],
    ['invalid canonical ID', { id: 'Id Raro!' }],
  ])('skips a coin with a %s', (_label, overrides) => {
    const result = mapCoinGeckoListing([{ ...bitcoin, ...overrides }, ethereum])

    expect(result.ok && result.value.quotes).toHaveLength(1)
    expect(result.ok && result.value.skipped).toBe(1)
  })

  it('keeps the first duplicate and counts later copies as skipped', () => {
    const result = mapCoinGeckoListing([bitcoin, { ...bitcoin, current_price: 1 }])

    expect(result.ok && result.value.quotes).toHaveLength(1)
    expect(result.ok && result.value.quotes[0]?.price.toString()).toBe('85591')
    expect(result.ok && result.value.skipped).toBe(1)
  })

  it.each([[{ status: { error_code: 429 } }], ['text'], [null], [42], [[]]])(
    'returns INVALID_RESPONSE for an unusable response (%j)',
    (body) => {
      expect(mapCoinGeckoListing(body)).toEqual({
        ok: false,
        error: { kind: 'INVALID_RESPONSE' },
      })
    },
  )

  it('returns INVALID_RESPONSE when no coin can be mapped', () => {
    expect(mapCoinGeckoListing([{ ...bitcoin, current_price: null }])).toEqual({
      ok: false,
      error: { kind: 'INVALID_RESPONSE' },
    })
  })
})

describe('7-day sparkline mapping', () => {
  it('maps the series when present', () => {
    const result = mapCoinGeckoMarkets(
      bitcoinWith({ sparkline_in_7d: { price: [1, 2, 3] } }),
      ONLY_BTC,
    )

    expect(result.quotes[0]?.sparkline7d).toEqual([1, 2, 3])
  })

  it('leaves the series undefined when the response omits it', () => {
    const result = mapCoinGeckoMarkets(COINGECKO_MARKETS_FIXTURE, ONLY_BTC)

    expect(result.quotes).toHaveLength(1)
    expect(result.quotes[0]?.sparkline7d).toBeUndefined()
  })

  it.each([
    ['null', null],
    ['text', 'invalid'],
    ['missing prices', {}],
    ['non-numeric prices', { price: ['a', 'b'] }],
    ['empty series', { price: [] }],
  ])('ignores an invalid %s series without rejecting the coin', (_label, sparkline) => {
    const result = mapCoinGeckoMarkets(bitcoinWith({ sparkline_in_7d: sparkline }), ONLY_BTC)

    expect(result.failures).toEqual([])
    expect(result.quotes).toHaveLength(1)
    expect(result.quotes[0]?.sparkline7d).toBeUndefined()
  })

  it('preserves the series in listings', () => {
    const result = mapCoinGeckoListing(bitcoinWith({ sparkline_in_7d: { price: [1, 2, 3] } }))

    expect(result.ok && result.value.quotes[0]?.sparkline7d).toEqual([1, 2, 3])
  })
})

describe('coin logo mapping', () => {
  it('maps the HTTPS logo URL from the real response', () => {
    const result = mapCoinGeckoMarkets(COINGECKO_MARKETS_FIXTURE, ONLY_BTC)

    expect(result.quotes[0]?.imageUrl).toBe(
      'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400',
    )
  })

  it.each([
    ['http', 'http://example.com/a.png'],
    ['javascript', 'javascript:alert(1)'],
    ['data', 'data:image/png;base64,AAAA'],
    ['non-URL text', 'not a URL'],
    ['empty', ''],
    ['null', null],
    ['number', 42],
  ])('ignores an invalid logo (%s) without invalidating the coin', (_label, image) => {
    const result = mapCoinGeckoMarkets(bitcoinWith({ image }), ONLY_BTC)

    expect(result.failures).toEqual([])
    expect(result.quotes).toHaveLength(1)
    expect(result.quotes[0]?.imageUrl).toBeUndefined()
  })

  it('preserves logos in listings', () => {
    const result = mapCoinGeckoListing(COINGECKO_MARKETS_FIXTURE)

    expect(result.ok && result.value.quotes.every((quote) => quote.imageUrl !== undefined)).toBe(
      true,
    )
  })
})

describe('mapCoinGeckoOhlc', () => {
  it('maps OHLC rows, preserves decimal prices, and sorts by timestamp', () => {
    const result = mapCoinGeckoOhlc([
      [2_000, 2.25, 3.5, 1.75, 3],
      [1_000, 1, 2, 0.5, 1.5],
    ])

    expect(result.ok).toBe(true)
    expect(
      result.ok &&
        result.value.map((candle) => ({
          time: candle.time,
          open: candle.open.toString(),
          high: candle.high.toString(),
          low: candle.low.toString(),
          close: candle.close.toString(),
        })),
    ).toEqual([
      { time: 1_000, open: '1', high: '2', low: '0.5', close: '1.5' },
      { time: 2_000, open: '2.25', high: '3.5', low: '1.75', close: '3' },
    ])
  })

  it('accepts an empty OHLC response', () => {
    expect(mapCoinGeckoOhlc([])).toEqual({ ok: true, value: [] })
  })

  it.each([
    ['non-array body', { rows: [] }],
    ['null body', null],
    ['row with missing fields', [[1, 2, 3, 4]]],
    ['row with extra fields', [[1, 2, 3, 4, 5, 6]]],
    ['non-numeric field', [[1, 2, '3', 0, 2]]],
    ['negative timestamp', [[-1, 1, 2, 0, 1]]],
    ['fractional timestamp', [[1.5, 1, 2, 0, 1]]],
    ['negative price', [[1, -1, 2, 0, 1]]],
    ['price above supported range', [[1, 1e12, 1e12, 0, 1e12]]],
    ['high below low', [[1, 2, 1, 3, 2]]],
    ['high below open', [[1, 3, 2, 1, 2]]],
    ['high below close', [[1, 1, 2, 0, 3]]],
    ['low above open', [[1, 1, 3, 2, 2]]],
    ['low above close', [[1, 3, 4, 2, 1]]],
  ])('rejects the full response when it has a %s', (_label, body) => {
    expect(mapCoinGeckoOhlc(body)).toEqual({
      ok: false,
      error: { kind: 'INVALID_RESPONSE' },
    })
  })

  it('rejects duplicate timestamps instead of returning ambiguous candles', () => {
    expect(
      mapCoinGeckoOhlc([
        [1_000, 1, 2, 0, 1],
        [1_000, 1, 2, 0, 1],
      ]),
    ).toEqual({ ok: false, error: { kind: 'INVALID_RESPONSE' } })
  })
})
