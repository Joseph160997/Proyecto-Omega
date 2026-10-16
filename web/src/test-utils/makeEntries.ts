import { depositEntry } from '@/domain/ledger/entries'
import { Money } from '@/domain/shared/money'
import { notionalValue } from '@/domain/shared/notional'
import { Price } from '@/domain/shared/price'
import { Quantity } from '@/domain/shared/quantity'

import type { DepositEntry, TradeEntry } from '@/domain/ledger/entries'
import type { Result } from '@/domain/shared/result'

export const T0 = 1_700_000_000_000
export const BTC = 'crypto:bitcoin'
export const ETH = 'crypto:ethereum'

export const deposit = (id: string, amount: string): DepositEntry =>
  depositEntry(id, Money.usd(amount), T0)

function trade(
  kind: 'buy' | 'sell',
  id: string,
  assetId: string,
  quantity: string,
  price: string,
  feeBps: number,
): TradeEntry {
  const qty = Quantity.of(quantity)
  const unitPrice = Price.of(price)
  const notional = notionalValue(qty, unitPrice)
  const fee = notional.applyBasisPoints(feeBps)

  return {
    kind,
    id,
    assetId,
    quantity: qty,
    price: unitPrice,
    notional,
    fee,
    total: kind === 'buy' ? notional.add(fee) : notional.subtract(fee),
    createdAt: T0,
  }
}

/** Compra con comisión (por defecto 10 puntos básicos = 0.1 %). */
export const buy = (id: string, assetId: string, quantity: string, price: string, feeBps = 10) =>
  trade('buy', id, assetId, quantity, price, feeBps)

export const sell = (id: string, assetId: string, quantity: string, price: string, feeBps = 10) =>
  trade('sell', id, assetId, quantity, price, feeBps)

/** Desenvuelve un Result en los tests: si era un error, falla con su contenido. */
export function must<T, E>(result: Result<T, E>): T {
  if (!result.ok) throw new Error(`se esperaba ok, llegó ${JSON.stringify(result.error)}`)

  return result.value
}
