import { describe, expect, it } from 'vitest'

import { entryFromTrade } from '@/domain/ledger/entries'
import { applyEntry, EMPTY_LEDGER, heldQuantity, replayLedger } from '@/domain/ledger/ledger'
import { evaluateBuy, evaluateSell } from '@/domain/orders/rules'
import { Money } from '@/domain/shared/money'
import { Price } from '@/domain/shared/price'
import { Quantity } from '@/domain/shared/quantity'
import { BTC, buy, deposit, ETH, must, sell, T0 } from '@/test-utils/makeEntries'

import type { LedgerEntry } from '@/domain/ledger/entries'
import type { LedgerState } from '@/domain/ledger/ledger'
import type { TradingConditions } from '@/domain/orders/rules'

/** Applies entries one at a time and fails if any entry is rejected. */
const apply = (entries: LedgerEntry[], from: LedgerState = EMPTY_LEDGER) =>
  entries.reduce((state, entry) => must(applyEntry(state, entry)), from)

/** Text summary for comparisons without depending on Money's internal representation. */
const summary = (state: LedgerState) => ({
  cash: state.cash.toString(),
  deposited: state.deposited.toString(),
  realized: state.realizedPnl.toString(),
  fees: state.totalFees.toString(),
  positions: [...state.positions.values()].map(
    (position) =>
      `${position.assetId} ${position.quantity.toString()} @cost ${position.costBasis.toString()}`,
  ),
})

describe('initial state', () => {
  it('is empty', () => {
    expect(summary(EMPTY_LEDGER)).toEqual({
      cash: '0.00',
      deposited: '0.00',
      realized: '0.00',
      fees: '0.00',
      positions: [],
    })
    expect(EMPTY_LEDGER.entryCount).toBe(0)
  })
})

describe('deposits', () => {
  it('increase cash and total deposited', () => {
    const state = apply([deposit('d1', '10000'), deposit('d2', '500.50')])

    expect(summary(state)).toMatchObject({ cash: '10500.50', deposited: '10500.50' })
    expect(state.entryCount).toBe(2)
  })

  it.each([['0'], ['-100']])('rejects a deposit of %s', (amount) => {
    expect(applyEntry(EMPTY_LEDGER, deposit('d1', amount))).toEqual({
      ok: false,
      error: { kind: 'INVALID_DEPOSIT', entryId: 'd1' },
    })
  })
})

describe('buys', () => {
  const funded = apply([deposit('d1', '20000')])

  it('subtract the total including fees and create a position with that cost basis', () => {
    const state = apply([buy('b1', BTC, '0.1', '50000')], funded)

    // 0.1 × 50,000 = 5,000.00 + 0.1% fee (5.00) = 5,005.00.
    expect(summary(state)).toMatchObject({
      cash: '14995.00',
      fees: '5.00',
      positions: [`${BTC} 0.1 @cost 5005.00`],
    })
  })

  it('a second purchase of the same asset adds to its quantity and cost basis', () => {
    const state = apply([buy('b1', BTC, '0.1', '50000'), buy('b2', BTC, '0.1', '60000')], funded)

    // 5,005.00 + (6,000.00 + 6.00) = 11,011.00.
    expect(summary(state)).toMatchObject({
      cash: '8989.00',
      fees: '11.00',
      positions: [`${BTC} 0.2 @cost 11011.00`],
    })
  })

  it('creates separate positions for different assets', () => {
    const state = apply([buy('b1', BTC, '0.1', '50000'), buy('b2', ETH, '1', '2500')], funded)

    expect(summary(state).positions).toEqual([`${BTC} 0.1 @cost 5005.00`, `${ETH} 1 @cost 2502.50`])
  })

  it('accepts a purchase when cash exactly matches its total', () => {
    const state = apply([buy('b1', BTC, '0.1', '50000')], apply([deposit('d1', '5005.00')]))

    expect(state.cash.toString()).toBe('0.00')
  })

  it('rejects a purchase without enough cash and reports required and available amounts', () => {
    const poor = apply([deposit('d1', '100')])

    const result = applyEntry(poor, buy('b1', BTC, '0.1', '50000'))

    expect(result.ok).toBe(false)
    expect(!result.ok && result.error.kind).toBe('INSUFFICIENT_CASH')

    if (!result.ok && result.error.kind === 'INSUFFICIENT_CASH') {
      expect(result.error.required.toString()).toBe('5005.00')
      expect(result.error.available.toString()).toBe('100.00')
    }
  })
})

describe('sales (average cost)', () => {
  const holding = apply([deposit('d1', '10000'), buy('b1', BTC, '0.1', '50000')])

  it('a partial sale removes the proportional cost basis and realizes the difference', () => {
    const state = apply([sell('s1', BTC, '0.05', '55000')], holding)

    // Sale proceeds: 2,750.00 − 2.75 fee = 2,747.25.
    // Cost basis sold: 5,005.00 × 0.05 / 0.1 = 2,502.50, realizing a 244.75 gain.
    expect(summary(state)).toEqual({
      cash: '7742.25',
      deposited: '10000.00',
      realized: '244.75',
      fees: '7.75',
      positions: [`${BTC} 0.05 @cost 2502.50`],
    })
  })

  it('selling below cost realizes a loss', () => {
    const state = apply([sell('s1', BTC, '0.05', '40000')], holding)

    // 2,000.00 − 2.00 = 1,998.00 against a 2,502.50 cost basis.
    expect(state.realizedPnl.toString()).toBe('-504.50')
  })

  it('a full sale closes the position and removes its cost basis', () => {
    const state = apply([sell('s1', BTC, '0.1', '52000')], holding)

    expect(summary(state)).toEqual({
      cash: '10189.80',
      deposited: '10000.00',
      realized: '189.80',
      fees: '10.20',
      positions: [],
    })
  })

  it('rejects selling more than the held quantity and reports what is available', () => {
    const result = applyEntry(holding, sell('s1', BTC, '0.2', '50000'))

    expect(!result.ok && result.error.kind).toBe('INSUFFICIENT_POSITION')

    if (!result.ok && result.error.kind === 'INSUFFICIENT_POSITION') {
      expect(result.error.requested.toString()).toBe('0.2')
      expect(result.error.available.toString()).toBe('0.1')
    }
  })

  it('rejects selling an asset that was never purchased (zero available)', () => {
    const result = applyEntry(holding, sell('s1', ETH, '1', '2500'))

    expect(!result.ok && result.error.kind).toBe('INSUFFICIENT_POSITION')

    if (!result.ok && result.error.kind === 'INSUFFICIENT_POSITION') {
      expect(result.error.available.toString()).toBe('0')
    }
  })
})

describe('rounding: cost basis is fully accounted for', () => {
  it('handles three sales when cost basis does not divide into exact cents', () => {
    // 3 × 33.33666667 = 100.01 cost basis, with no fee.
    let state = apply([deposit('d1', '1000'), buy('b1', BTC, '3', '33.33666667', 0)])

    expect(state.positions.get(BTC)?.costBasis.toString()).toBe('100.01')

    state = apply([sell('s1', BTC, '1', '40', 0)], state)
    // 100.01 / 3 = 33.3366… → 33.34 cost basis removed; 66.67 remains.
    expect(summary(state).positions).toEqual([`${BTC} 2 @cost 66.67`])

    state = apply([sell('s2', BTC, '1', '40', 0)], state)
    // 66.67 / 2 = 33.335 → 33.34; 33.33 remains.
    expect(summary(state).positions).toEqual([`${BTC} 1 @cost 33.33`])

    state = apply([sell('s3', BTC, '1', '40', 0)], state)
    // The final sale removes EXACTLY the remaining 33.33, not a rounded calculation.
    expect(summary(state).positions).toEqual([])

    // Sales brought in 120.00 against a 100.01 cost basis: the gain is exactly 19.99.
    expect(summary(state)).toMatchObject({ cash: '1019.99', realized: '19.99' })
  })
})

describe('corrupted entries', () => {
  const funded = apply([deposit('d1', '20000')])

  it('rejects a total that does not match the notional and fee', () => {
    const tampered = { ...buy('b1', BTC, '0.1', '50000'), total: Money.usd('1') }

    expect(applyEntry(funded, tampered)).toEqual({
      ok: false,
      error: { kind: 'INVALID_TRADE_ENTRY', entryId: 'b1' },
    })
  })

  it('rejects a zero quantity', () => {
    const tampered = { ...buy('b1', BTC, '1', '10'), quantity: Quantity.zero() }

    expect(!applyEntry(funded, tampered).ok).toBe(true)
  })

  it('rejects a zero price', () => {
    const tampered = { ...buy('b1', BTC, '1', '10'), price: Price.of('0') }

    expect(!applyEntry(funded, tampered).ok).toBe(true)
  })
})

describe('immutability', () => {
  it('applying an entry does not mutate the previous state', () => {
    const before = apply([deposit('d1', '10000')])
    const snapshot = summary(before)

    const after = apply([buy('b1', BTC, '0.1', '50000')], before)

    expect(summary(before)).toEqual(snapshot)
    expect(before.positions).not.toBe(after.positions)
    expect(before.positions.size).toBe(0)
  })

  it('a rejected entry does not change the state', () => {
    const state = apply([deposit('d1', '100')])
    const snapshot = summary(state)

    applyEntry(state, buy('b1', BTC, '0.1', '50000'))

    expect(summary(state)).toEqual(snapshot)
  })
})

describe('replayLedger', () => {
  const entries: LedgerEntry[] = [
    deposit('d1', '10000'),
    buy('b1', BTC, '0.1', '50000'),
    sell('s1', BTC, '0.05', '55000'),
  ]

  it('returns the empty state when there are no entries', () => {
    expect(summary(must(replayLedger([])))).toEqual(summary(EMPTY_LEDGER))
  })

  it('matches applying each entry one at a time', () => {
    expect(summary(must(replayLedger(entries)))).toEqual(summary(apply(entries)))
  })

  it('is deterministic when replayed more than once', () => {
    expect(summary(must(replayLedger(entries)))).toEqual(summary(must(replayLedger(entries))))
  })

  it('does not mutate the entry list', () => {
    const copy = [...entries]

    replayLedger(entries)

    expect(entries).toEqual(copy)
  })

  it('stops at the first invalid entry and reports its index', () => {
    const result = replayLedger([deposit('d1', '100'), buy('b1', BTC, '0.1', '50000')])

    expect(!result.ok && result.error.index).toBe(1)
    expect(!result.ok && result.error.error.kind).toBe('INSUFFICIENT_CASH')
    expect(!result.ok && result.error.error.entryId).toBe('b1')
  })

  it('detects duplicate ids', () => {
    expect(replayLedger([deposit('d1', '100'), deposit('d1', '200')])).toEqual({
      ok: false,
      error: { index: 1, error: { kind: 'DUPLICATE_ENTRY_ID', entryId: 'd1' } },
    })
  })
})

describe('heldQuantity', () => {
  it('returns zero for an unheld asset and its quantity for a held asset', () => {
    const state = apply([deposit('d1', '10000'), buy('b1', BTC, '0.1', '50000')])

    expect(heldQuantity(state, ETH).toString()).toBe('0')
    expect(heldQuantity(state, BTC).toString()).toBe('0.1')
  })
})

describe('order rules integration', () => {
  const conditions = (price: string): TradingConditions => ({
    quote: { assetId: BTC, price: Price.of(price), timestamp: T0, source: 'coingecko' },
    now: T0,
    maxQuoteAgeMs: 60_000,
    feeBps: 10,
  })

  it('converts a rule-approved purchase into the correct ledger entry', () => {
    const state = apply([deposit('d1', '10000')])

    const trade = must(evaluateBuy(Quantity.of('0.1'), conditions('50000'), state.cash))
    const entry = entryFromTrade('e1', trade)

    expect(entry).toMatchObject({ kind: 'buy', id: 'e1', assetId: BTC, createdAt: T0 })
    expect(entry.total.toString()).toBe('5005.00')
    expect(summary(apply([entry], state)).cash).toBe('4995.00')
  })

  it('sell rules use the quantity actually held in the ledger', () => {
    const state = apply([deposit('d1', '10000'), buy('b1', BTC, '0.1', '50000')])

    const rejected = evaluateSell(Quantity.of('0.2'), conditions('55000'), heldQuantity(state, BTC))
    const accepted = evaluateSell(Quantity.of('0.1'), conditions('55000'), heldQuantity(state, BTC))

    expect(!rejected.ok && rejected.error.kind).toBe('INSUFFICIENT_POSITION')
    expect(accepted.ok).toBe(true)
  })
})

describe('invariants over a long simulation', () => {
  /** A seeded pseudo-random generator keeps the simulation deterministic. */
  function seeded(seed: number) {
    let value = seed

    return () => {
      value = (value * 1664525 + 1013904223) % 4294967296

      return value / 4294967296
    }
  }

  function costOfOpenPositions(state: LedgerState): Money {
    return [...state.positions.values()].reduce(
      (sum, position) => sum.add(position.costBasis),
      Money.zero(),
    )
  }

  it('cash plus open cost basis always equals deposits plus realized P&L to the cent', () => {
    const random = seeded(42)
    const assets = [BTC, ETH, 'crypto:solana']
    const prices = [50_000, 2_500, 120]
    const sizes = ['0.001', '0.01', '0.05', '0.1', '0.5', '1', '2.5']
    let state = apply([deposit('d0', '25000')])
    let buys = 0
    let sells = 0
    let rejections = 0

    for (let step = 1; step <= 400; step += 1) {
      const index = Math.floor(random() * assets.length)
      const assetId = assets[index] ?? BTC
      const price = Math.min(
        1_000_000,
        Math.max(1, (prices[index] ?? 1) * (0.97 + random() * 0.06)),
      )

      prices[index] = price

      const conditions: TradingConditions = {
        quote: { assetId, price: Price.of(price.toFixed(2)), timestamp: T0, source: 'coingecko' },
        now: T0,
        maxQuoteAgeMs: 60_000,
        feeBps: 10,
      }
      const quantity = Quantity.of(sizes[Math.floor(random() * sizes.length)] ?? '1')
      const isBuy = random() < 0.55

      const result = isBuy
        ? evaluateBuy(quantity, conditions, state.cash)
        : evaluateSell(quantity, conditions, heldQuantity(state, assetId))

      if (!result.ok) {
        rejections += 1
        continue
      }

      state = must(applyEntry(state, entryFromTrade(`e${step}`, result.value)))

      if (isBuy) buys += 1
      else sells += 1

      // These invariants must never be broken:
      expect(state.cash.isNegative()).toBe(false)
      for (const position of state.positions.values()) {
        expect(position.quantity.isZero()).toBe(false)
        expect(position.costBasis.isNegative()).toBe(false)
      }
      expect(state.cash.add(costOfOpenPositions(state)).toString()).toBe(
        state.deposited.add(state.realizedPnl).toString(),
      )
    }

    // The simulation exercised buys, sells, and rejections.
    expect(buys).toBeGreaterThan(20)
    expect(sells).toBeGreaterThan(20)
    expect(rejections).toBeGreaterThan(0)
  })
})
