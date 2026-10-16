import { Money } from '@/domain/shared/money'
import { prorate } from '@/domain/shared/prorate'
import { Quantity } from '@/domain/shared/quantity'
import { err, ok } from '@/domain/shared/result'

import type { LedgerEntry, TradeEntry } from '@/domain/ledger/entries'
import type { Result } from '@/domain/shared/result'

export interface Position {
  readonly assetId: string
  readonly quantity: Quantity
  /** Lo que costó lo que aún se tiene (comisiones incluidas). */
  readonly costBasis: Money
}

export interface LedgerState {
  readonly cash: Money
  /** Solo posiciones abiertas (cantidad mayor que cero). */
  readonly positions: ReadonlyMap<string, Position>
  /** Todo el dinero depositado. */
  readonly deposited: Money
  /** Ganancia o pérdida ya materializada con ventas (costo promedio). */
  readonly realizedPnl: Money
  readonly totalFees: Money
  readonly entryCount: number
}

export type LedgerError =
  | { kind: 'INVALID_DEPOSIT'; entryId: string }
  | { kind: 'INVALID_TRADE_ENTRY'; entryId: string }
  | { kind: 'DUPLICATE_ENTRY_ID'; entryId: string }
  | { kind: 'INSUFFICIENT_CASH'; entryId: string; required: Money; available: Money }
  | {
      kind: 'INSUFFICIENT_POSITION'
      entryId: string
      assetId: string
      requested: Quantity
      available: Quantity
    }

export interface LedgerReplayError {
  /** Posición del asiento que falló dentro de la lista. */
  readonly index: number
  readonly error: LedgerError
}

export const EMPTY_LEDGER: LedgerState = {
  cash: Money.zero(),
  positions: new Map(),
  deposited: Money.zero(),
  realizedPnl: Money.zero(),
  totalFees: Money.zero(),
  entryCount: 0,
}

export function heldQuantity(state: LedgerState, assetId: string): Quantity {
  return state.positions.get(assetId)?.quantity ?? Quantity.zero()
}

/** La aritmética de un asiento tiene que cuadrar consigo misma (protege contra datos corruptos). */
function isConsistent(entry: TradeEntry): boolean {
  const expectedTotal =
    entry.kind === 'buy' ? entry.notional.add(entry.fee) : entry.notional.subtract(entry.fee)

  return (
    !entry.quantity.isZero() &&
    !entry.price.isZero() &&
    !entry.notional.isNegative() &&
    !entry.fee.isNegative() &&
    expectedTotal.equals(entry.total)
  )
}

/**
 * Aplica un asiento al estado y devuelve el estado nuevo; no modifica el original.
 * No comprueba ids repetidos (para eso está `replayLedger`).
 *
 * Costo promedio: al vender se da de baja la parte proporcional del costo. En una venta total
 * se da de baja TODO lo que queda, así el redondeo a centavos nunca deja restos ni descuadres.
 */
export function applyEntry(
  state: LedgerState,
  entry: LedgerEntry,
): Result<LedgerState, LedgerError> {
  if (entry.kind === 'deposit') {
    if (entry.amount.isZero() || entry.amount.isNegative()) {
      return err({ kind: 'INVALID_DEPOSIT', entryId: entry.id })
    }

    return ok({
      ...state,
      cash: state.cash.add(entry.amount),
      deposited: state.deposited.add(entry.amount),
      entryCount: state.entryCount + 1,
    })
  }

  if (!isConsistent(entry)) return err({ kind: 'INVALID_TRADE_ENTRY', entryId: entry.id })

  const held = state.positions.get(entry.assetId)
  const positions = new Map(state.positions)

  if (entry.kind === 'buy') {
    if (state.cash.isLessThan(entry.total)) {
      return err({
        kind: 'INSUFFICIENT_CASH',
        entryId: entry.id,
        required: entry.total,
        available: state.cash,
      })
    }

    positions.set(entry.assetId, {
      assetId: entry.assetId,
      quantity: held ? held.quantity.add(entry.quantity) : entry.quantity,
      costBasis: (held?.costBasis ?? Money.zero()).add(entry.total),
    })

    return ok({
      ...state,
      cash: state.cash.subtract(entry.total),
      positions,
      totalFees: state.totalFees.add(entry.fee),
      entryCount: state.entryCount + 1,
    })
  }

  if (!held || held.quantity.isLessThan(entry.quantity)) {
    return err({
      kind: 'INSUFFICIENT_POSITION',
      entryId: entry.id,
      assetId: entry.assetId,
      requested: entry.quantity,
      available: held?.quantity ?? Quantity.zero(),
    })
  }

  const isFullSale = held.quantity.equals(entry.quantity)
  const costOfSold = isFullSale
    ? held.costBasis
    : prorate(held.costBasis, entry.quantity, held.quantity)

  if (isFullSale) {
    positions.delete(entry.assetId)
  } else {
    positions.set(entry.assetId, {
      assetId: entry.assetId,
      quantity: held.quantity.subtract(entry.quantity),
      costBasis: held.costBasis.subtract(costOfSold),
    })
  }

  return ok({
    ...state,
    cash: state.cash.add(entry.total),
    positions,
    realizedPnl: state.realizedPnl.add(entry.total.subtract(costOfSold)),
    totalFees: state.totalFees.add(entry.fee),
    entryCount: state.entryCount + 1,
  })
}

/** Reconstruye el estado desde cero. Se detiene en el primer asiento inválido y dice cuál es. */
export function replayLedger(
  entries: readonly LedgerEntry[],
): Result<LedgerState, LedgerReplayError> {
  const seen = new Set<string>()
  let state = EMPTY_LEDGER

  for (const [index, entry] of entries.entries()) {
    if (seen.has(entry.id))
      return err({ index, error: { kind: 'DUPLICATE_ENTRY_ID', entryId: entry.id } })

    seen.add(entry.id)

    const result = applyEntry(state, entry)

    if (!result.ok) return err({ index, error: result.error })

    state = result.value
  }

  return ok(state)
}
