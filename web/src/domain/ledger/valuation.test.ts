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
  it('es el costo de lo que se tiene entre la cantidad, comisiones incluidas', () => {
    const state = stateOf([
      deposit('d1', '20000'),
      buy('b1', BTC, '0.1', '50000'),
      buy('b2', BTC, '0.1', '60000'),
    ])
    const position = state.positions.get(BTC)

    if (!position) throw new Error('falta la posición de BTC')

    // 11,011.00 / 0.2 = 55,055
    expect(averageCost(position).toString()).toBe('55055')
  })
})

describe('valuePortfolio', () => {
  const state = stateOf([
    deposit('d1', '10000'),
    buy('b1', BTC, '0.1', '50000'),
    buy('b2', ETH, '1', '2500'),
  ])
  // Efectivo: 10,000 − 5,005.00 − 2,502.50 = 2,492.50

  it('sin posiciones, el valor es el efectivo', () => {
    const result = valuePortfolio(stateOf([deposit('d1', '1000')]), prices({}))

    expect(result.totalValue.toString()).toBe('1000.00')
    expect(result.positions).toEqual([])
    expect(result.unpriced).toEqual([])
  })

  it('el valor sube con el mercado sin tocar el ledger', () => {
    const up = valuePortfolio(state, prices({ [BTC]: '60000', [ETH]: '3000' }))

    // BTC: 0.1 × 60,000 = 6,000.00 (costó 5,005.00) → +995.00
    // ETH: 1 × 3,000 = 3,000.00 (costó 2,502.50) → +497.50
    expect(up.positionsValue.toString()).toBe('9000.00')
    expect(up.totalValue.toString()).toBe('11492.50')
    expect(up.unrealizedPnl.toString()).toBe('1492.50')
    expect(up.realizedPnl.toString()).toBe('0.00')
  })

  it('y baja cuando el mercado baja, con pérdidas no realizadas negativas', () => {
    const down = valuePortfolio(state, prices({ [BTC]: '40000', [ETH]: '2000' }))

    // BTC: 4,000.00 − 5,005.00 = −1,005.00 · ETH: 2,000.00 − 2,502.50 = −502.50
    expect(down.unrealizedPnl.toString()).toBe('-1507.50')
    expect(down.totalValue.toString()).toBe('8492.50')
  })

  it('cada posición trae su detalle', () => {
    const result = valuePortfolio(state, prices({ [BTC]: '60000', [ETH]: '3000' }))
    const btc = result.positions.find((position) => position.assetId === BTC)

    expect(btc?.quantity.toString()).toBe('0.1')
    expect(btc?.costBasis.toString()).toBe('5005.00')
    expect(btc?.averageCost.toString()).toBe('50050')
    expect(btc?.price.toString()).toBe('60000')
    expect(btc?.value.toString()).toBe('6000.00')
    expect(btc?.unrealizedPnl.toString()).toBe('995.00')
  })

  it('las posiciones salen ordenadas por activo, siempre igual', () => {
    const result = valuePortfolio(state, prices({ [BTC]: '60000', [ETH]: '3000' }))

    expect(result.positions.map((position) => position.assetId)).toEqual([BTC, ETH])
  })

  it('una posición sin precio NO se valora y se avisa (no se inventa un valor)', () => {
    const result = valuePortfolio(state, prices({ [BTC]: '60000' }))

    expect(result.unpriced).toEqual([ETH])
    expect(result.positions.map((position) => position.assetId)).toEqual([BTC])
    expect(result.positionsValue.toString()).toBe('6000.00')
    expect(result.totalValue.toString()).toBe('8492.50') // 2,492.50 de efectivo + 6,000.00
    expect(result.unrealizedPnl.toString()).toBe('995.00')
  })

  it('la ganancia realizada por ventas se conserva al valorar', () => {
    const afterSale = stateOf([
      deposit('d1', '10000'),
      buy('b1', BTC, '0.1', '50000'),
      sell('s1', BTC, '0.05', '55000'),
    ])

    const result = valuePortfolio(afterSale, prices({ [BTC]: '55000' }))

    expect(result.realizedPnl.toString()).toBe('244.75')
    // Quedan 0.05 BTC valorados a 55,000 = 2,750.00, con costo de 2,502.50 → +247.50
    expect(result.unrealizedPnl.toString()).toBe('247.50')
    // 7,742.25 de efectivo + 2,750.00 de posición.
    expect(result.totalValue.toString()).toBe('10492.25')
    // Identidad contable: con todo valorado, el valor total = depositado + realizado + no realizado.
    expect(result.totalValue.toString()).toBe(
      afterSale.deposited.add(result.realizedPnl).add(result.unrealizedPnl).toString(),
    )
  })
})
