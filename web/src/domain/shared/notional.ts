import { D } from '@/domain/shared/decimal'
import { Money } from '@/domain/shared/money'

import type { Price } from '@/domain/shared/price'
import type { Quantity } from '@/domain/shared/quantity'

/**
 * Valor de `quantity` unidades a `price`.
 * Único punto donde el producto se redondea a centavos (half-up).
 */
export function notionalValue(quantity: Quantity, price: Price): Money {
  const exact = new D(quantity.toString()).times(new D(price.toString()))
  return Money.usd(exact.toFixed())
}
