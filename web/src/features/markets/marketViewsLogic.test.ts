import { describe, expect, it } from 'vitest'

import { SORT_KEYS } from '@/features/markets/marketTableLogic'
import {
  applyView,
  MARKET_VIEW_IDS,
  MARKET_VIEWS,
  TOP_COUNT,
  topOf,
} from '@/features/markets/marketViewsLogic'
import { SAMPLE_QUOTES } from '@/test-utils/sampleQuotes'

import type { MarketQuote } from '@/domain/market/quote'

const ids = (quotes: readonly MarketQuote[]) => quotes.map((quote) => quote.assetId)

describe('MARKET_VIEWS', () => {
  it('defines a view for every id with a matching id and unique label', () => {
    expect(Object.keys(MARKET_VIEWS).sort()).toEqual([...MARKET_VIEW_IDS].sort())

    const labels = MARKET_VIEW_IDS.map((id) => MARKET_VIEWS[id].label)

    expect(new Set(labels).size).toBe(labels.length)
    MARKET_VIEW_IDS.forEach((id) => {
      expect(MARKET_VIEWS[id].id).toBe(id)
      expect(MARKET_VIEWS[id].label).not.toBe('')
    })
  })

  it('each view’s default sort uses a valid column', () => {
    MARKET_VIEW_IDS.forEach((id) => {
      expect(SORT_KEYS).toContain(MARKET_VIEWS[id].sort.key)
    })
  })
})

describe('applyView', () => {
  it('"all" keeps every asset and sorts by market cap, with missing values last', () => {
    expect(ids(applyView(SAMPLE_QUOTES, 'all'))).toEqual([
      'crypto:btc',
      'crypto:eth',
      'crypto:xrp',
      'crypto:sol',
      'crypto:ada',
      'crypto:new',
    ])
  })

  it('"gainers" includes only visible gainers, ordered from highest to lowest', () => {
    // ada sube 0.004 %: se ve 0.00%, es plano y no entra.
    expect(ids(applyView(SAMPLE_QUOTES, 'gainers'))).toEqual(['crypto:eth', 'crypto:btc'])
  })

  it('"losers" includes only decliners, from the largest drop to the smallest', () => {
    expect(ids(applyView(SAMPLE_QUOTES, 'losers'))).toEqual(['crypto:sol', 'crypto:xrp'])
  })

  it('"volume" excludes assets without volume and sorts descending', () => {
    expect(ids(applyView(SAMPLE_QUOTES, 'volume'))).toEqual([
      'crypto:eth',
      'crypto:sol',
      'crypto:btc',
      'crypto:xrp',
    ])
  })

  it('"active" sorts by volume / market cap and excludes uncalculated values', () => {
    // sol 0.4, eth 0.2, xrp 0.05, btc 0.02; ada (sin volumen) y new (sin datos) fuera.
    expect(ids(applyView(SAMPLE_QUOTES, 'active'))).toEqual([
      'crypto:sol',
      'crypto:eth',
      'crypto:xrp',
      'crypto:btc',
    ])
  })

  it('does not mutate the input array', () => {
    const before = ids(SAMPLE_QUOTES)

    MARKET_VIEW_IDS.forEach((id) => applyView(SAMPLE_QUOTES, id))

    expect(ids(SAMPLE_QUOTES)).toEqual(before)
  })
})

describe('topOf', () => {
  it('returns the first five items by default', () => {
    expect(TOP_COUNT).toBe(5)
    expect(topOf(SAMPLE_QUOTES, 'all')).toHaveLength(5)
  })

  it('returns fewer items when the view has fewer than the requested count', () => {
    expect(topOf(SAMPLE_QUOTES, 'gainers', 5)).toHaveLength(2)
  })

  it('each card is exactly the beginning of its full view list', () => {
    MARKET_VIEW_IDS.forEach((id) => {
      expect(ids(topOf(SAMPLE_QUOTES, id, 3))).toEqual(
        ids(applyView(SAMPLE_QUOTES, id).slice(0, 3)),
      )
    })
  })
})
