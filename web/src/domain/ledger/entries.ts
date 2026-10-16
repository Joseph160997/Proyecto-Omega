import type { Trade } from '@/domain/orders/trade'
import type { Money } from '@/domain/shared/money'
import type { Price } from '@/domain/shared/price'
import type { Quantity } from '@/domain/shared/quantity'

/** Dinero que entra a la cuenta. El capital inicial es el primer depósito. */
export interface DepositEntry {
  readonly kind: 'deposit'
  readonly id: string
  readonly amount: Money
  readonly createdAt: number
}

/**
 * Una compra o venta ejecutada. Es un HECHO histórico: `notional`, `fee` y `total` se guardan
 * tal como ocurrieron y no se recalculan, así un cambio futuro en las reglas de redondeo o de
 * comisión no reescribe el pasado.
 */
export interface TradeEntry {
  readonly kind: 'buy' | 'sell'
  readonly id: string
  readonly assetId: string
  readonly quantity: Quantity
  readonly price: Price
  readonly notional: Money
  readonly fee: Money
  readonly total: Money
  readonly createdAt: number
}

export type LedgerEntry = DepositEntry | TradeEntry

export function depositEntry(id: string, amount: Money, createdAt: number): DepositEntry {
  return { kind: 'deposit', id, amount, createdAt }
}

/** Convierte una orden aceptada por las reglas (`Trade`) en el asiento que se guarda. */
export function entryFromTrade(id: string, trade: Trade): TradeEntry {
  return {
    kind: trade.side,
    id,
    assetId: trade.assetId,
    quantity: trade.quantity,
    price: trade.price,
    notional: trade.notional,
    fee: trade.fee,
    total: trade.total,
    createdAt: trade.executedAt,
  }
}
