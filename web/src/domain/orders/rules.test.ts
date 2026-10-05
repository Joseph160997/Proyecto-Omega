import { describe, expect, it } from 'vitest'

import { evaluateBuy, evaluateSell } from '@/domain/orders/rules'
import { Money } from '@/domain/shared/money'
import { Price } from '@/domain/shared/price'
import { Quantity } from '@/domain/shared/quantity'

import type { Quote } from '@/domain/market/quote'
import type { OrderRejection } from '@/domain/orders/rejection'
import type { TradingConditions } from '@/domain/orders/rules'
import type { Trade } from '@/domain/orders/trade'
import type { Result } from '@/domain/shared/result'

const NOW = 1_700_000_000_000

const quote = (price: string, timestamp = NOW): Quote => ({
  assetId: 'crypto:btc',
  price: Price.of(price),
  timestamp,
  source: 'coingecko',
})

const conditions = (overrides: Partial<TradingConditions> = {}): TradingConditions => ({
  quote: quote('100000'),
  now: NOW,
  maxQuoteAgeMs: 60_000,
  feeBps: 10,
  ...overrides,
})

function tradeOf(result: Result<Trade, OrderRejection>): Trade {
  if (!result.ok) throw new Error(`expected a valid order, got ${result.error.kind}`)
  return result.value
}

function rejectionOf(result: Result<Trade, OrderRejection>): OrderRejection {
  if (result.ok) throw new Error('expected a rejection')
  return result.error
}

describe('evaluateBuy', () => {
  it('calculates notional, fee, and total', () => {
    const trade = tradeOf(evaluateBuy(Quantity.of('0.5'), conditions(), Money.usd(100_000)))

    expect(trade.side).toBe('buy')
    expect(trade.assetId).toBe('crypto:btc')
    expect(trade.quantity.toString()).toBe('0.5')
    expect(trade.price.toString()).toBe('100000')
    expect(trade.notional.toString()).toBe('50000.00')
    expect(trade.fee.toString()).toBe('50.00')
    expect(trade.total.toString()).toBe('50050.00')
    expect(trade.executedAt).toBe(NOW)
  })

  it('rounds the fee to cents', () => {
    const trade = tradeOf(
      evaluateBuy(Quantity.of('1'), conditions({ quote: quote('99.99') }), Money.usd(1_000)),
    )

    expect(trade.fee.toString()).toBe('0.10')
    expect(trade.total.toString()).toBe('100.09')
  })

  it('with zero fee, total equals notional', () => {
    const trade = tradeOf(
      evaluateBuy(Quantity.of('0.5'), conditions({ feeBps: 0 }), Money.usd(100_000)),
    )

    expect(trade.fee.toString()).toBe('0.00')
    expect(trade.total.toString()).toBe('50000.00')
  })

  it('rejects invalid fee basis points', () => {
    expect(() =>
      evaluateBuy(Quantity.of('0.5'), conditions({ feeBps: -1 }), Money.usd(100_000)),
    ).toThrow(RangeError)
  })

  it('accepts when the cash matches exactly', () => {
    const result = evaluateBuy(Quantity.of('0.5'), conditions(), Money.usd('50050.00'))

    expect(result.ok).toBe(true)
  })

  it('rejects by a penny', () => {
    const rejection = rejectionOf(
      evaluateBuy(Quantity.of('0.5'), conditions(), Money.usd('50049.99')),
    )

    expect(rejection.kind).toBe('INSUFFICIENT_CASH')
  })

  it('reports how much is needed and how much is available', () => {
    const rejection = rejectionOf(evaluateBuy(Quantity.of('0.015'), conditions(), Money.usd(1_000)))

    expect(rejection.kind).toBe('INSUFFICIENT_CASH')

    if (rejection.kind === 'INSUFFICIENT_CASH') {
      expect(rejection.required.toString()).toBe('1501.50')
      expect(rejection.available.toString()).toBe('1000.00')
    }
  })

  it('rejects zero quantity', () => {
    const rejection = rejectionOf(evaluateBuy(Quantity.zero(), conditions(), Money.usd(1_000)))

    expect(rejection).toEqual({ kind: 'INVALID_QUANTITY' })
  })

  it('rejects a quote with zero price', () => {
    const rejection = rejectionOf(
      evaluateBuy(Quantity.of('1'), conditions({ quote: quote('0') }), Money.usd(1_000)),
    )

    expect(rejection).toEqual({ kind: 'INVALID_PRICE' })
  })

  it('rejects dust that would round to $0.00', () => {
    const rejection = rejectionOf(
      evaluateBuy(
        Quantity.of('0.00000001'),
        conditions({ quote: quote('97000') }),
        Money.usd(1_000),
      ),
    )

    expect(rejection).toEqual({ kind: 'ORDER_TOO_SMALL' })
  })

  describe('stale quote', () => {
    it('accepts exactly at the limit', () => {
      const old = conditions({ quote: quote('100000', NOW - 60_000) })

      expect(evaluateBuy(Quantity.of('0.1'), old, Money.usd(100_000)).ok).toBe(true)
    })

    it('rejects one millisecond after the limit and reports the age', () => {
      const old = conditions({ quote: quote('100000', NOW - 60_001) })
      const rejection = rejectionOf(evaluateBuy(Quantity.of('0.1'), old, Money.usd(100_000)))

      expect(rejection).toEqual({ kind: 'STALE_QUOTE', ageMs: 60_001, maxAgeMs: 60_000 })
    })
  })

  describe('validation order', () => {
    const veryOld = conditions({ quote: quote('100000', NOW - 120_000) })

    it('a stale quote wins over insufficient funds', () => {
      const rejection = rejectionOf(evaluateBuy(Quantity.of('0.5'), veryOld, Money.usd(1)))

      expect(rejection.kind).toBe('STALE_QUOTE')
    })

    it('zero quantity wins over stale quote', () => {
      const rejection = rejectionOf(evaluateBuy(Quantity.zero(), veryOld, Money.usd(1)))

      expect(rejection.kind).toBe('INVALID_QUANTITY')
    })
  })
})

describe('evaluateSell', () => {
  it('calculates notional, fee, and cash inflow', () => {
    const trade = tradeOf(evaluateSell(Quantity.of('0.5'), conditions(), Quantity.of('1')))

    expect(trade.side).toBe('sell')
    expect(trade.notional.toString()).toBe('50000.00')
    expect(trade.fee.toString()).toBe('50.00')
    expect(trade.total.toString()).toBe('49950.00')
  })

  it('allows selling the full position', () => {
    const result = evaluateSell(Quantity.of('0.25'), conditions(), Quantity.of('0.25'))

    expect(result.ok).toBe(true)
  })

  it('rejects selling more than owned and reports both quantities', () => {
    const rejection = rejectionOf(
      evaluateSell(Quantity.of('0.5'), conditions(), Quantity.of('0.25')),
    )

    expect(rejection.kind).toBe('INSUFFICIENT_POSITION')

    if (rejection.kind === 'INSUFFICIENT_POSITION') {
      expect(rejection.requested.toString()).toBe('0.5')
      expect(rejection.available.toString()).toBe('0.25')
    }
  })

  it('rejects zero quantity', () => {
    const rejection = rejectionOf(evaluateSell(Quantity.zero(), conditions(), Quantity.of('1')))

    expect(rejection).toEqual({ kind: 'INVALID_QUANTITY' })
  })

  it('rejects stale quotes', () => {
    const old = conditions({ quote: quote('100000', NOW - 60_001) })
    const rejection = rejectionOf(evaluateSell(Quantity.of('0.1'), old, Quantity.of('1')))

    expect(rejection.kind).toBe('STALE_QUOTE')
  })

  it('allows dust liquidation: cash inflow is $0.00 and nothing is given away', () => {
    const dust = Quantity.of('0.00000001')
    const trade = tradeOf(evaluateSell(dust, conditions({ quote: quote('97000') }), dust))

    expect(trade.total.toString()).toBe('0.00')
  })
})
