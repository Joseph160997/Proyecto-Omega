import { describe, expect, it } from 'vitest'

import { applyEntry, EMPTY_LEDGER } from '@/domain/ledger/ledger'
import { averageCost, valuePortfolio } from '@/domain/ledger/valuation'
import { Price } from '@/domain/shared/price'
import { BTC, buy, deposit, ETH, must, sell } from '@/test-utils/makeEntries'

import type { LedgerEntry } from '@/domain/ledger/entries'

const stateOf = (entries: LedgerEntry[]) =>
  entries.reduce((state, entry) => must(applyEntry(state, entry)), EMPTY_LEDGER)

const prices =
  (table: Record<string, string>) =>
  (assetId: string): Price | undefined => {
    const price = table[assetId]

    return price === undefined ? undefined : Price.of(price)
  }

describe('averageCost', () => {
  it('calculates held cost per unit, including fees', () => {
    const state = stateOf([
      deposit('d1', '20000'),
      buy('b1', BTC, '0.1', '50000'),
      buy('b2', BTC, '0.1', '60000'),
    ])
    const position = state.positions.get(BTC)

    if (!position) throw new Error('Expected the BTC position to exist')

    // 11,011.00 / 0.2 = 55,055.
    expect(averageCost(position).toString()).toBe('55055')
  })
})

describe('valuePortfolio', () => {
  const state = stateOf([
    deposit('d1', '10000'),
    buy('b1', BTC, '0.1', '50000'),
    buy('b2', ETH, '1', '2500'),
  ])
  // Cash: 10,000 − 5,005.00 − 2,502.50 = 2,492.50.

  it('uses cash as total value when there are no positions', () => {
    const result = valuePortfolio(stateOf([deposit('d1', '1000')]), prices({}))

    expect(result.totalValue.toString()).toBe('1000.00')
    expect(result.positions).toEqual([])
    expect(result.unpriced).toEqual([])
  })

  it('reflects a market increase without changing the ledger', () => {
    const up = valuePortfolio(state, prices({ [BTC]: '60000', [ETH]: '3000' }))

    // BTC: 0.1 × 60,000 = 6,000.00 (cost 5,005.00) → +995.00.
    // ETH: 1 × 3,000 = 3,000.00 (cost 2,502.50) → +497.50.
    expect(up.positionsValue.toString()).toBe('9000.00')
    expect(up.totalValue.toString()).toBe('11492.50')
    expect(up.unrealizedPnl.toString()).toBe('1492.50')
    expect(up.realizedPnl.toString()).toBe('0.00')
  })

  it('reflects a market decline with negative unrealized P&L', () => {
    const down = valuePortfolio(state, prices({ [BTC]: '40000', [ETH]: '2000' }))

    // BTC: 4,000.00 − 5,005.00 = −1,005.00; ETH: 2,000.00 − 2,502.50 = −502.50.
    expect(down.unrealizedPnl.toString()).toBe('-1507.50')
    expect(down.totalValue.toString()).toBe('8492.50')
  })

  it('includes details for each priced position', () => {
    const result = valuePortfolio(state, prices({ [BTC]: '60000', [ETH]: '3000' }))
    const btc = result.positions.find((position) => position.assetId === BTC)

    expect(btc?.quantity.toString()).toBe('0.1')
    expect(btc?.costBasis.toString()).toBe('5005.00')
    expect(btc?.averageCost.toString()).toBe('50050')
    expect(btc?.price.toString()).toBe('60000')
    expect(btc?.value.toString()).toBe('6000.00')
    expect(btc?.unrealizedPnl.toString()).toBe('995.00')
  })

  it('returns positions in a stable asset order', () => {
    const result = valuePortfolio(state, prices({ [BTC]: '60000', [ETH]: '3000' }))

    expect(result.positions.map((position) => position.assetId)).toEqual([BTC, ETH])
  })

  it('does not value an unpriced position and reports it instead', () => {
    const result = valuePortfolio(state, prices({ [BTC]: '60000' }))

    expect(result.unpriced).toEqual([ETH])
    expect(result.positions.map((position) => position.assetId)).toEqual([BTC])
    expect(result.positionsValue.toString()).toBe('6000.00')
    expect(result.totalValue.toString()).toBe('8492.50') // 2,492.50 cash + 6,000.00.
    expect(result.unrealizedPnl.toString()).toBe('995.00')
  })

  it('preserves realized P&L from sales during valuation', () => {
    const afterSale = stateOf([
      deposit('d1', '10000'),
      buy('b1', BTC, '0.1', '50000'),
      sell('s1', BTC, '0.05', '55000'),
    ])

    const result = valuePortfolio(afterSale, prices({ [BTC]: '55000' }))

    expect(result.realizedPnl.toString()).toBe('244.75')
    // The remaining 0.05 BTC at 55,000 is worth 2,750.00 against a 2,502.50 cost → +247.50.
    expect(result.unrealizedPnl.toString()).toBe('247.50')
    // 7,742.25 cash + 2,750.00 position value.
    expect(result.totalValue.toString()).toBe('10492.25')
    // Accounting identity: when all positions are priced, total value = deposits + realized + unrealized P&L.
    expect(result.totalValue.toString()).toBe(
      afterSale.deposited.add(result.realizedPnl).add(result.unrealizedPnl).toString(),
    )
  })
})
