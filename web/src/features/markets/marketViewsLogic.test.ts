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
  it('tiene una vista por cada id, con su id y una etiqueta distinta', () => {
    expect(Object.keys(MARKET_VIEWS).sort()).toEqual([...MARKET_VIEW_IDS].sort())

    const labels = MARKET_VIEW_IDS.map((id) => MARKET_VIEWS[id].label)

    expect(new Set(labels).size).toBe(labels.length)
    MARKET_VIEW_IDS.forEach((id) => {
      expect(MARKET_VIEWS[id].id).toBe(id)
      expect(MARKET_VIEWS[id].label).not.toBe('')
    })
  })

  it('el orden por defecto de cada vista usa una columna válida', () => {
    MARKET_VIEW_IDS.forEach((id) => {
      expect(SORT_KEYS).toContain(MARKET_VIEWS[id].sort.key)
    })
  })
})

describe('applyView', () => {
  it('"all" conserva todo y ordena por capitalización, lo que no tiene dato al final', () => {
    expect(ids(applyView(SAMPLE_QUOTES, 'all'))).toEqual([
      'crypto:btc',
      'crypto:eth',
      'crypto:xrp',
      'crypto:sol',
      'crypto:ada',
      'crypto:new',
    ])
  })

  it('"gainers" solo incluye los que suben de forma visible, de mayor a menor', () => {
    // ada sube 0.004 %: se ve 0.00%, es plano y no entra.
    expect(ids(applyView(SAMPLE_QUOTES, 'gainers'))).toEqual(['crypto:eth', 'crypto:btc'])
  })

  it('"losers" solo incluye los que bajan, del que más cae al que menos', () => {
    expect(ids(applyView(SAMPLE_QUOTES, 'losers'))).toEqual(['crypto:sol', 'crypto:xrp'])
  })

  it('"volume" excluye los que no tienen volumen, de mayor a menor', () => {
    expect(ids(applyView(SAMPLE_QUOTES, 'volume'))).toEqual([
      'crypto:eth',
      'crypto:sol',
      'crypto:btc',
      'crypto:xrp',
    ])
  })

  it('"active" ordena por volumen / capitalización y excluye lo no calculable', () => {
    // sol 0.4, eth 0.2, xrp 0.05, btc 0.02; ada (sin volumen) y new (sin datos) fuera.
    expect(ids(applyView(SAMPLE_QUOTES, 'active'))).toEqual([
      'crypto:sol',
      'crypto:eth',
      'crypto:xrp',
      'crypto:btc',
    ])
  })

  it('no modifica el array recibido', () => {
    const before = ids(SAMPLE_QUOTES)

    MARKET_VIEW_IDS.forEach((id) => applyView(SAMPLE_QUOTES, id))

    expect(ids(SAMPLE_QUOTES)).toEqual(before)
  })
})

describe('topOf', () => {
  it('por defecto devuelve las primeras 5', () => {
    expect(TOP_COUNT).toBe(5)
    expect(topOf(SAMPLE_QUOTES, 'all')).toHaveLength(5)
  })

  it('devuelve menos si la vista no tiene tantos', () => {
    expect(topOf(SAMPLE_QUOTES, 'gainers', 5)).toHaveLength(2)
  })

  it('una tarjeta es exactamente el principio de la lista completa de su vista', () => {
    MARKET_VIEW_IDS.forEach((id) => {
      expect(ids(topOf(SAMPLE_QUOTES, id, 3))).toEqual(
        ids(applyView(SAMPLE_QUOTES, id).slice(0, 3)),
      )
    })
  })
})
