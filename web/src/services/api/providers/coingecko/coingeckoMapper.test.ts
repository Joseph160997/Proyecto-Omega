import { describe, expect, it } from 'vitest'

import { answersExactly } from '@/application/market/quotes-result'
import { mapCoinGeckoMarkets } from '@/services/api/providers/coingecko/coingeckoMapper'
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
