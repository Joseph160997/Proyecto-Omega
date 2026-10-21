import { describe, expect, it } from 'vitest'

import { replayLedger } from '@/domain/ledger/ledger'
import { valuePortfolio } from '@/domain/portfolio/valuation'
import { buy, deposit, must, BTC } from '@/test-utils/makeEntries'
import { makeQuote } from '@/test-utils/makeQuote'
import { Price } from '@/domain/shared/price'

describe('valuePortfolio', () => {
  const state = must(replayLedger([deposit('d1', '1000'), buy('b1', BTC, '1', '100')]))

  it('combines cash and current position values without changing the ledger', () => {
    const valuation = valuePortfolio(state, [
      makeQuote('bitcoin', { assetId: BTC, price: Price.of('120') }),
    ])

    expect(valuation.totalValue?.toString()).toBe('1019.90')
    expect(valuation.unrealizedPnl?.toString()).toBe('19.90')
    expect(valuation.positions[0]?.marketValue?.toString()).toBe('120.00')
    expect(state.cash.toString()).toBe('899.90')
  })

  it('withholds aggregate valuation when a position has no current quote', () => {
    const valuation = valuePortfolio(state, [])

    expect(valuation.totalValue).toBeUndefined()
    expect(valuation.unrealizedPnl).toBeUndefined()
    expect(valuation.positions[0]?.marketValue).toBeUndefined()
  })
})
