import { describe, expect, it } from 'vitest'

import { summarize, turnoverRatio } from '@/features/markets/marketStatsLogic'
import { makeQuote } from '@/test-utils/makeQuote'

import type { MarketQuote } from '@/domain/market/quote'

describe('turnoverRatio', () => {
  it('es volumen entre capitalización', () => {
    expect(turnoverRatio(makeQuote('a', { volume24h: 50, marketCap: 1000 }))).toBeCloseTo(0.05)
  })

  it('un volumen cero es válido y da 0', () => {
    expect(turnoverRatio(makeQuote('a', { volume24h: 0, marketCap: 1000 }))).toBe(0)
  })

  const invalid: Array<[string, Partial<MarketQuote>]> = [
    ['sin volumen', { marketCap: 1000 }],
    ['sin capitalización', { volume24h: 50 }],
    ['capitalización cero', { volume24h: 50, marketCap: 0 }],
    ['capitalización negativa', { volume24h: 50, marketCap: -5 }],
    ['volumen no finito', { volume24h: Infinity, marketCap: 1000 }],
    ['capitalización NaN', { volume24h: 50, marketCap: NaN }],
  ]

  it.each(invalid)('%s → undefined', (_label, overrides) => {
    expect(turnoverRatio(makeQuote('a', overrides))).toBeUndefined()
  })
})

describe('summarize', () => {
  it('sin activos: todo en cero y sin líder', () => {
    expect(summarize([])).toEqual({
      assetCount: 0,
      totalMarketCap: 0,
      totalVolume24h: 0,
      rising: 0,
      falling: 0,
      flat: 0,
      leader: undefined,
    })
  })

  it('suma capitalización y volumen e ignora datos faltantes o inválidos', () => {
    const result = summarize([
      makeQuote('a', { marketCap: 600, volume24h: 10 }),
      makeQuote('b', { marketCap: 300 }),
      makeQuote('c', { volume24h: 5 }),
      makeQuote('d', { marketCap: NaN, volume24h: -3 }),
    ])

    expect(result.assetCount).toBe(4)
    expect(result.totalMarketCap).toBe(900)
    expect(result.totalVolume24h).toBe(15)
  })

  it('cuenta suben, bajan y planos con el mismo criterio que la pantalla', () => {
    const result = summarize([
      makeQuote('a', { change24hPercent: 2 }),
      makeQuote('b', { change24hPercent: 0.004 }), // se ve 0.00%
      makeQuote('c', { change24hPercent: -0.004 }),
      makeQuote('d', { change24hPercent: -3 }),
      makeQuote('e'), // sin dato
    ])

    expect(result).toMatchObject({ rising: 1, falling: 1, flat: 3 })
  })

  it('el líder es el de mayor capitalización y su cuota se calcula sobre el total', () => {
    const result = summarize([
      makeQuote('a', { marketCap: 600 }),
      makeQuote('b', { marketCap: 300 }),
      makeQuote('c', { marketCap: 100 }),
    ])

    expect(result.leader?.assetId).toBe('crypto:a')
    expect(result.leader?.symbol).toBe('A')
    expect(result.leader?.share).toBeCloseTo(0.6)
  })

  it('en un empate de capitalización gana el primero', () => {
    const result = summarize([
      makeQuote('a', { marketCap: 500 }),
      makeQuote('b', { marketCap: 500 }),
    ])

    expect(result.leader?.assetId).toBe('crypto:a')
  })

  it('los que no tienen capitalización no pueden ser líder', () => {
    const result = summarize([
      makeQuote('a', { volume24h: 999 }),
      makeQuote('b', { marketCap: 10 }),
    ])

    expect(result.leader?.assetId).toBe('crypto:b')
  })

  it('sin ninguna capitalización no hay líder', () => {
    expect(summarize([makeQuote('a'), makeQuote('b')]).leader).toBeUndefined()
  })
})
