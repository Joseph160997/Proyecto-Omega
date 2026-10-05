import { isQuoteStale, quoteAgeMs } from '@/domain/market/quote'
import { notionalValue } from '@/domain/shared/notional'
import { err, ok } from '@/domain/shared/result'

import type { Quote } from '@/domain/market/quote'
import type { OrderRejection } from '@/domain/orders/rejection'
import type { Trade } from '@/domain/orders/trade'
import type { Money } from '@/domain/shared/money'
import type { Quantity } from '@/domain/shared/quantity'
import type { Result } from '@/domain/shared/result'

export interface TradingConditions {
  quote: Quote
  now: number
  maxQuoteAgeMs: number
  feeBps: number
}

/** Validaciones comunes a compra y venta, de la más barata a la más cara. */
function findCommonRejection(
  quantity: Quantity,
  { quote, now, maxQuoteAgeMs }: TradingConditions,
): OrderRejection | null {
  if (quantity.isZero()) return { kind: 'INVALID_QUANTITY' }
  if (quote.price.isZero()) return { kind: 'INVALID_PRICE' }

  if (isQuoteStale(quote, now, maxQuoteAgeMs)) {
    return { kind: 'STALE_QUOTE', ageMs: quoteAgeMs(quote, now), maxAgeMs: maxQuoteAgeMs }
  }

  return null
}

export function evaluateBuy(
  quantity: Quantity,
  conditions: TradingConditions,
  cash: Money,
): Result<Trade, OrderRejection> {
  const rejection = findCommonRejection(quantity, conditions)
  if (rejection) return err(rejection)

  const { quote, now, feeBps } = conditions
  const notional = notionalValue(quantity, quote.price)

  // Sin este mínimo, 0.00000001 BTC se redondea a $0.00 y se regalaría.
  if (notional.isZero()) return err({ kind: 'ORDER_TOO_SMALL' })

  const fee = notional.applyBasisPoints(feeBps)
  const total = notional.add(fee)

  if (cash.isLessThan(total)) {
    return err({ kind: 'INSUFFICIENT_CASH', required: total, available: cash })
  }

  return ok({
    side: 'buy',
    assetId: quote.assetId,
    quantity,
    price: quote.price,
    notional,
    fee,
    total,
    executedAt: now,
  })
}

export function evaluateSell(
  quantity: Quantity,
  conditions: TradingConditions,
  held: Quantity,
): Result<Trade, OrderRejection> {
  const rejection = findCommonRejection(quantity, conditions)
  if (rejection) return err(rejection)

  if (held.isLessThan(quantity)) {
    return err({ kind: 'INSUFFICIENT_POSITION', requested: quantity, available: held })
  }

  const { quote, now, feeBps } = conditions
  const notional = notionalValue(quantity, quote.price)
  const fee = notional.applyBasisPoints(feeBps)

  // Vender polvo (notional $0.00) se permite: no regala nada y deja liquidar restos.
  return ok({
    side: 'sell',
    assetId: quote.assetId,
    quantity,
    price: quote.price,
    notional,
    fee,
    total: notional.subtract(fee),
    executedAt: now,
  })
}
