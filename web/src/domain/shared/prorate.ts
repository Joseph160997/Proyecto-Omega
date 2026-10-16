import { D, ROUND_HALF_UP } from '@/domain/shared/decimal'
import { Money } from '@/domain/shared/money'
import { Price } from '@/domain/shared/price'

import type { Quantity } from '@/domain/shared/quantity'

/** amount × part / whole, redondeado a centavos (half-up). `whole` debe ser mayor que cero. */
export function prorate(amount: Money, part: Quantity, whole: Quantity): Money {
  if (whole.isZero()) throw new RangeError('prorate: el total no puede ser cero')

  const result = new D(amount.toString()).times(part.toString()).dividedBy(whole.toString())

  return Money.usd(result.toFixed())
}

/** Costo por unidad (costBasis / quantity) a 8 decimales, half-up. Para mostrar, no para operar. */
export function unitCost(costBasis: Money, quantity: Quantity): Price {
  if (quantity.isZero()) throw new RangeError('unitCost: la cantidad no puede ser cero')

  const result = new D(costBasis.toString())
    .dividedBy(quantity.toString())
    .toDecimalPlaces(8, ROUND_HALF_UP)

  return Price.of(result.toFixed())
}
