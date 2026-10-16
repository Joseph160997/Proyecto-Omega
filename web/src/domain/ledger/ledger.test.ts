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

/** Aplica asientos uno a uno; falla el test si alguno es rechazado. */
const apply = (entries: LedgerEntry[], from: LedgerState = EMPTY_LEDGER) =>
  entries.reduce((state, entry) => must(applyEntry(state, entry)), from)

/** Resumen en texto para comparar sin depender de la estructura interna de Money. */
const summary = (state: LedgerState) => ({
  cash: state.cash.toString(),
  deposited: state.deposited.toString(),
  realized: state.realizedPnl.toString(),
  fees: state.totalFees.toString(),
  positions: [...state.positions.values()].map(
    (position) =>
      `${position.assetId} ${position.quantity.toString()} @costo ${position.costBasis.toString()}`,
  ),
})

describe('estado inicial', () => {
  it('está vacío', () => {
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

describe('depósitos', () => {
  it('suman al efectivo y a lo depositado', () => {
    const state = apply([deposit('d1', '10000'), deposit('d2', '500.50')])

    expect(summary(state)).toMatchObject({ cash: '10500.50', deposited: '10500.50' })
    expect(state.entryCount).toBe(2)
  })

  it.each([['0'], ['-100']])('un depósito de %s es inválido', (amount) => {
    expect(applyEntry(EMPTY_LEDGER, deposit('d1', amount))).toEqual({
      ok: false,
      error: { kind: 'INVALID_DEPOSIT', entryId: 'd1' },
    })
  })
})

describe('compras', () => {
  const funded = apply([deposit('d1', '20000')])

  it('restan el total (comisión incluida) y crean la posición con su costo', () => {
    const state = apply([buy('b1', BTC, '0.1', '50000')], funded)

    // 0.1 × 50,000 = 5,000.00 + 0.1 % de comisión (5.00) = 5,005.00
    expect(summary(state)).toMatchObject({
      cash: '14995.00',
      fees: '5.00',
      positions: [`${BTC} 0.1 @costo 5005.00`],
    })
  })

  it('una segunda compra del mismo activo acumula cantidad y costo', () => {
    const state = apply([buy('b1', BTC, '0.1', '50000'), buy('b2', BTC, '0.1', '60000')], funded)

    // 5,005.00 + (6,000.00 + 6.00) = 11,011.00
    expect(summary(state)).toMatchObject({
      cash: '8989.00',
      fees: '11.00',
      positions: [`${BTC} 0.2 @costo 11011.00`],
    })
  })

  it('activos distintos son posiciones distintas', () => {
    const state = apply([buy('b1', BTC, '0.1', '50000'), buy('b2', ETH, '1', '2500')], funded)

    expect(summary(state).positions).toEqual([
      `${BTC} 0.1 @costo 5005.00`,
      `${ETH} 1 @costo 2502.50`,
    ])
  })

  it('con el efectivo justo, la compra se acepta y deja el efectivo en cero', () => {
    const state = apply([buy('b1', BTC, '0.1', '50000')], apply([deposit('d1', '5005.00')]))

    expect(state.cash.toString()).toBe('0.00')
  })

  it('sin efectivo suficiente se rechaza, diciendo cuánto hace falta y cuánto hay', () => {
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

describe('ventas (costo promedio)', () => {
  const holding = apply([deposit('d1', '10000'), buy('b1', BTC, '0.1', '50000')])

  it('una venta parcial da de baja la parte proporcional del costo y realiza la diferencia', () => {
    const state = apply([sell('s1', BTC, '0.05', '55000')], holding)

    // Venta: 2,750.00 − 2.75 de comisión = 2,747.25 de entrada.
    // Costo de lo vendido: 5,005.00 × 0.05 / 0.1 = 2,502.50 → ganancia realizada 244.75.
    expect(summary(state)).toEqual({
      cash: '7742.25',
      deposited: '10000.00',
      realized: '244.75',
      fees: '7.75',
      positions: [`${BTC} 0.05 @costo 2502.50`],
    })
  })

  it('vender por debajo del costo realiza una pérdida', () => {
    const state = apply([sell('s1', BTC, '0.05', '40000')], holding)

    // 2,000.00 − 2.00 = 1,998.00 contra un costo de 2,502.50.
    expect(state.realizedPnl.toString()).toBe('-504.50')
  })

  it('una venta total cierra la posición y su costo desaparece', () => {
    const state = apply([sell('s1', BTC, '0.1', '52000')], holding)

    expect(summary(state)).toEqual({
      cash: '10189.80',
      deposited: '10000.00',
      realized: '189.80',
      fees: '10.20',
      positions: [],
    })
  })

  it('vender más de lo que se tiene se rechaza, diciendo cuánto hay', () => {
    const result = applyEntry(holding, sell('s1', BTC, '0.2', '50000'))

    expect(!result.ok && result.error.kind).toBe('INSUFFICIENT_POSITION')

    if (!result.ok && result.error.kind === 'INSUFFICIENT_POSITION') {
      expect(result.error.requested.toString()).toBe('0.2')
      expect(result.error.available.toString()).toBe('0.1')
    }
  })

  it('vender un activo que nunca se compró se rechaza (disponible: cero)', () => {
    const result = applyEntry(holding, sell('s1', ETH, '1', '2500'))

    expect(!result.ok && result.error.kind).toBe('INSUFFICIENT_POSITION')

    if (!result.ok && result.error.kind === 'INSUFFICIENT_POSITION') {
      expect(result.error.available.toString()).toBe('0')
    }
  })
})

describe('redondeo: el costo nunca se pierde ni sobra', () => {
  it('tres ventas de una posición cuyo costo no se divide en centavos exactos', () => {
    // 3 × 33.33666667 = 100.01 de costo, sin comisión.
    let state = apply([deposit('d1', '1000'), buy('b1', BTC, '3', '33.33666667', 0)])

    expect(state.positions.get(BTC)?.costBasis.toString()).toBe('100.01')

    state = apply([sell('s1', BTC, '1', '40', 0)], state)
    // 100.01 / 3 = 33.3366… → 33.34 de costo dado de baja; quedan 66.67.
    expect(summary(state).positions).toEqual([`${BTC} 2 @costo 66.67`])

    state = apply([sell('s2', BTC, '1', '40', 0)], state)
    // 66.67 / 2 = 33.335 → 33.34; quedan 33.33.
    expect(summary(state).positions).toEqual([`${BTC} 1 @costo 33.33`])

    state = apply([sell('s3', BTC, '1', '40', 0)], state)
    // La última venta da de baja EXACTAMENTE lo que queda: 33.33, no un cálculo redondeado.
    expect(summary(state).positions).toEqual([])

    // Entró 120.00 por las ventas, costó 100.01: la ganancia es 19.99 al centavo.
    expect(summary(state)).toMatchObject({ cash: '1019.99', realized: '19.99' })
  })
})

describe('asientos corruptos', () => {
  const funded = apply([deposit('d1', '20000')])

  it('un total que no cuadra con importe y comisión se rechaza', () => {
    const tampered = { ...buy('b1', BTC, '0.1', '50000'), total: Money.usd('1') }

    expect(applyEntry(funded, tampered)).toEqual({
      ok: false,
      error: { kind: 'INVALID_TRADE_ENTRY', entryId: 'b1' },
    })
  })

  it('una cantidad cero se rechaza', () => {
    const tampered = { ...buy('b1', BTC, '1', '10'), quantity: Quantity.zero() }

    expect(!applyEntry(funded, tampered).ok).toBe(true)
  })

  it('un precio cero se rechaza', () => {
    const tampered = { ...buy('b1', BTC, '1', '10'), price: Price.of('0') }

    expect(!applyEntry(funded, tampered).ok).toBe(true)
  })
})

describe('inmutabilidad', () => {
  it('aplicar un asiento no modifica el estado anterior', () => {
    const before = apply([deposit('d1', '10000')])
    const snapshot = summary(before)

    const after = apply([buy('b1', BTC, '0.1', '50000')], before)

    expect(summary(before)).toEqual(snapshot)
    expect(before.positions).not.toBe(after.positions)
    expect(before.positions.size).toBe(0)
  })

  it('un asiento rechazado no cambia nada', () => {
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

  it('sin asientos es el estado vacío', () => {
    expect(summary(must(replayLedger([])))).toEqual(summary(EMPTY_LEDGER))
  })

  it('da lo mismo que aplicar los asientos uno a uno', () => {
    expect(summary(must(replayLedger(entries)))).toEqual(summary(apply(entries)))
  })

  it('es determinista: reconstruir dos veces da lo mismo', () => {
    expect(summary(must(replayLedger(entries)))).toEqual(summary(must(replayLedger(entries))))
  })

  it('no modifica la lista de asientos', () => {
    const copy = [...entries]

    replayLedger(entries)

    expect(entries).toEqual(copy)
  })

  it('se detiene en el primer asiento inválido y dice cuál es', () => {
    const result = replayLedger([deposit('d1', '100'), buy('b1', BTC, '0.1', '50000')])

    expect(!result.ok && result.error.index).toBe(1)
    expect(!result.ok && result.error.error.kind).toBe('INSUFFICIENT_CASH')
    expect(!result.ok && result.error.error.entryId).toBe('b1')
  })

  it('detecta ids repetidos', () => {
    expect(replayLedger([deposit('d1', '100'), deposit('d1', '200')])).toEqual({
      ok: false,
      error: { index: 1, error: { kind: 'DUPLICATE_ENTRY_ID', entryId: 'd1' } },
    })
  })
})

describe('heldQuantity', () => {
  it('es cero para lo que no se tiene y la cantidad para lo que sí', () => {
    const state = apply([deposit('d1', '10000'), buy('b1', BTC, '0.1', '50000')])

    expect(heldQuantity(state, ETH).toString()).toBe('0')
    expect(heldQuantity(state, BTC).toString()).toBe('0.1')
  })
})

describe('con las reglas de órdenes', () => {
  const conditions = (price: string): TradingConditions => ({
    quote: { assetId: BTC, price: Price.of(price), timestamp: T0, source: 'coingecko' },
    now: T0,
    maxQuoteAgeMs: 60_000,
    feeBps: 10,
  })

  it('una compra aceptada por las reglas se convierte en el asiento correcto', () => {
    const state = apply([deposit('d1', '10000')])

    const trade = must(evaluateBuy(Quantity.of('0.1'), conditions('50000'), state.cash))
    const entry = entryFromTrade('e1', trade)

    expect(entry).toMatchObject({ kind: 'buy', id: 'e1', assetId: BTC, createdAt: T0 })
    expect(entry.total.toString()).toBe('5005.00')
    expect(summary(apply([entry], state)).cash).toBe('4995.00')
  })

  it('las reglas de venta usan lo que realmente se tiene en el ledger', () => {
    const state = apply([deposit('d1', '10000'), buy('b1', BTC, '0.1', '50000')])

    const rejected = evaluateSell(Quantity.of('0.2'), conditions('55000'), heldQuantity(state, BTC))
    const accepted = evaluateSell(Quantity.of('0.1'), conditions('55000'), heldQuantity(state, BTC))

    expect(!rejected.ok && rejected.error.kind).toBe('INSUFFICIENT_POSITION')
    expect(accepted.ok).toBe(true)
  })
})

describe('invariantes en una simulación larga', () => {
  /** Generador pseudoaleatorio con semilla: la simulación es siempre la misma. */
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

  it('efectivo + costo de lo que se tiene = depositado + ganancia realizada, siempre y al centavo', () => {
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

      // Las tres reglas que no se pueden romper:
      expect(state.cash.isNegative()).toBe(false)
      for (const position of state.positions.values()) {
        expect(position.quantity.isZero()).toBe(false)
        expect(position.costBasis.isNegative()).toBe(false)
      }
      expect(state.cash.add(costOfOpenPositions(state)).toString()).toBe(
        state.deposited.add(state.realizedPnl).toString(),
      )
    }

    // La simulación ejercitó de verdad compras, ventas y rechazos.
    expect(buys).toBeGreaterThan(20)
    expect(sells).toBeGreaterThan(20)
    expect(rejections).toBeGreaterThan(0)
  })
})
