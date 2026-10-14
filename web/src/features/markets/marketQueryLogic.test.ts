import { describe, expect, it } from 'vitest'

import {
  defaultMarketQuery,
  marketHref,
  parseMarketQuery,
  selectRows,
  toSearchParams,
  withPage,
  withSearch,
  withSort,
  withView,
} from '@/features/markets/marketQueryLogic'
import { FIRST_DIRECTION } from '@/features/markets/marketTableLogic'
import { MARKET_VIEWS } from '@/features/markets/marketViewsLogic'
import { SAMPLE_QUOTES } from '@/test-utils/sampleQuotes'

import type { MarketQueryState } from '@/features/markets/marketQueryLogic'
import type { SortState } from '@/features/markets/marketTableLogic'

const parse = (queryString: string) => parseMarketQuery(new URLSearchParams(queryString))

describe('parseMarketQuery', () => {
  it('uses the default state when there are no parameters', () => {
    expect(parse('')).toEqual(defaultMarketQuery())
  })

  it.each([
    ['gainers', 'gainers'],
    ['losers', 'losers'],
    ['volume', 'volume'],
    ['active', 'active'],
    ['nope', 'all'],
    ['', 'all'],
    ['GAINERS', 'all'], // distingue mayúsculas
  ])('view=%j → %s, con el orden propio de esa vista', (value, expected) => {
    const state = parse(`view=${value}`)

    expect(state.view).toBe(expected)
    expect(state.sort).toEqual(MARKET_VIEWS[state.view].sort)
  })

  describe('sorting', () => {
    const defaultSort = MARKET_VIEWS.all.sort

    const cases: Array<[string, SortState]> = [
      ['sort=price&dir=asc', { key: 'price', direction: 'asc' }],
      ['sort=price&dir=desc', { key: 'price', direction: 'desc' }],
      ['sort=price', { key: 'price', direction: FIRST_DIRECTION.price }],
      ['sort=name', { key: 'name', direction: 'asc' }],
      ['sort=price&dir=up', { key: 'price', direction: 'desc' }],
      ['sort=nope&dir=asc', defaultSort],
      ['dir=asc', defaultSort],
    ]

    it.each(cases)('%s', (queryString, expected) => {
      expect(parse(queryString).sort).toEqual(expected)
    })
  })

  describe('pagination', () => {
    const cases: Array<[string, number]> = [
      ['page=3', 3],
      ['page=1', 1],
      ['page=0', 1],
      ['page=-1', 1],
      ['page=abc', 1],
      ['page=1.5', 1],
      ['page=2e1', 1],
      ['page=', 1],
      ['page=999999', 999999],
      ['page=1000000', 1], // más de 6 dígitos: se descarta
    ]

    it.each(cases)('%s → %s', (queryString, expected) => {
      expect(parse(queryString).page).toBe(expected)
    })
  })

  describe('search', () => {
    it('decodes spaces and special characters', () => {
      expect(parse('q=bit%20coin').search).toBe('bit coin')
      expect(parse('q=a+b').search).toBe('a b')
    })

    it('does not trim spaces while typing', () => {
      expect(parse('q=%20bit%20').search).toBe(' bit ')
    })

    it('limits the length', () => {
      expect(parse(`q=${'a'.repeat(100)}`).search).toHaveLength(64)
    })

    it('uses the first value for a repeated parameter', () => {
      expect(parse('q=a&q=b').search).toBe('a')
    })

    it('uses an empty string when there is no value', () => {
      expect(parse('q=').search).toBe('')
    })
  })
})

describe('toSearchParams', () => {
  it('does not serialize the default state', () => {
    expect(toSearchParams(defaultMarketQuery()).toString()).toBe('')
  })

  it('serializes only the view when it uses its default sort', () => {
    expect(toSearchParams(defaultMarketQuery('gainers')).toString()).toBe('view=gainers')
  })

  it('serializes non-default values in a stable order', () => {
    const state = withPage(withSort(withSearch(defaultMarketQuery('gainers'), 'e'), 'price'), 2)

    expect(toSearchParams(state).toString()).toBe('view=gainers&q=e&sort=price&dir=desc&page=2')
  })

  const roundTrip: Array<[string, MarketQueryState]> = [
    ['por defecto', defaultMarketQuery()],
    ['otra vista', defaultMarketQuery('gainers')],
    ['búsqueda', withSearch(defaultMarketQuery(), 'sol')],
    ['búsqueda con caracteres especiales', withSearch(defaultMarketQuery(), 'a b&c=d ñ #1')],
    ['orden distinto', withSort(defaultMarketQuery(), 'price')],
    [
      'misma columna de la vista, otra dirección',
      withSort(defaultMarketQuery('losers'), 'change24h'),
    ],
    ['página', withPage(defaultMarketQuery(), 3)],
    ['todo junto', withPage(withSort(withSearch(defaultMarketQuery('volume'), 'e'), 'name'), 2)],
  ]

  it.each(roundTrip)('serialization round-trips the state: %s', (_label, state) => {
    expect(parseMarketQuery(toSearchParams(state))).toEqual(state)
  })
})

describe('marketHref', () => {
  it.each([
    [defaultMarketQuery(), '/markets'],
    [defaultMarketQuery('gainers'), '/markets?view=gainers'],
    [withSearch(defaultMarketQuery(), 'a b'), '/markets?q=a+b'],
    [withPage(defaultMarketQuery(), 2), '/markets?page=2'],
  ])('%j → %s', (state, expected) => {
    expect(marketHref(state)).toBe(expected)
  })
})

describe('user actions', () => {
  const busy: MarketQueryState = {
    view: 'all',
    search: 'x',
    sort: { key: 'price', direction: 'asc' },
    page: 4,
  }

  it('switching views applies that view’s sort, resets the page, and preserves the search', () => {
    expect(withView(busy, 'losers')).toEqual({
      view: 'losers',
      search: 'x',
      sort: MARKET_VIEWS.losers.sort,
      page: 1,
    })
  })

  it('searching resets the page and limits the length', () => {
    expect(withSearch(busy, 'sol').page).toBe(1)
    expect(withSearch(busy, 'a'.repeat(100)).search).toHaveLength(64)
  })

  it('sorting toggles direction on the same column and resets the page', () => {
    const result = withSort(busy, 'price')

    expect(result.sort).toEqual({ key: 'price', direction: 'desc' })
    expect(result.page).toBe(1)
  })

  it('sorting by another column uses its initial direction', () => {
    expect(withSort(busy, 'name').sort).toEqual({ key: 'name', direction: 'asc' })
  })

  it.each([
    [3, 3],
    [0, 1],
    [-5, 1],
    [2.9, 2],
    [NaN, 1],
    [Infinity, 1],
  ])('withPage(%s) → página %s', (page, expected) => {
    expect(withPage(busy, page).page).toBe(expected)
  })

  it('does not mutate the original state', () => {
    const before = { ...busy }

    withView(busy, 'gainers')
    withSearch(busy, 'z')
    withSort(busy, 'name')
    withPage(busy, 9)

    expect(busy).toEqual(before)
  })
})

describe('selectRows', () => {
  const ids = (state: MarketQueryState) =>
    selectRows(SAMPLE_QUOTES, state).map((quote) => quote.assetId)

  it('matches the full view with the default state', () => {
    expect(ids(defaultMarketQuery())).toEqual([
      'crypto:btc',
      'crypto:eth',
      'crypto:xrp',
      'crypto:sol',
      'crypto:ada',
      'crypto:new',
    ])
  })

  it('applies the view before the search', () => {
    expect(ids(withSearch(defaultMarketQuery('gainers'), 'eth'))).toEqual(['crypto:eth'])
    expect(ids(withSearch(defaultMarketQuery('gainers'), 'sol'))).toEqual([])
  })

  it('prioritizes the user-selected sort over the view default', () => {
    const state = withSort(defaultMarketQuery(), 'name')

    expect(ids(state)).toEqual([
      'crypto:ada',
      'crypto:btc',
      'crypto:eth',
      'crypto:new',
      'crypto:sol',
      'crypto:xrp',
    ])
  })

  it('returns an empty list when a search has no matches', () => {
    expect(ids(withSearch(defaultMarketQuery(), 'zzz'))).toEqual([])
  })
})
