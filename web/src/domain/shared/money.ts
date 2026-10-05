import { parseRounded } from '@/domain/shared/decimal-input'

import type { Dec } from '@/domain/shared/decimal'
import type { DecimalLimits } from '@/domain/shared/decimal-input'

export type CurrencyCode = 'USD'

// 1e22: debe cubrir QUANTITY_MAX × PRICE_MAX (1e21). Lo verifica notional.test.ts.
export const MONEY_MAX = '10000000000000000000000'

const MONEY_LIMITS: DecimalLimits = { max: MONEY_MAX, maxDecimals: 2 }

export class Money {
  readonly currency: CurrencyCode = 'USD'
  private readonly amount: Dec

  private constructor(amount: Dec) {
    this.amount = amount
  }

  /** Acepta string o number. Lanza si el valor es inválido o excede el máximo. */
  static usd(value: string | number): Money {
    const parsed = parseRounded(value, MONEY_LIMITS, { allowNegative: true })

    if (!parsed.ok) {
      throw new RangeError(`Money inválido (${parsed.error.kind}): ${String(value).slice(0, 40)}`)
    }

    return new Money(parsed.value)
  }

  static zero(): Money {
    return Money.usd(0)
  }

  add(other: Money): Money {
    return new Money(this.amount.plus(other.amount))
  }

  subtract(other: Money): Money {
    return new Money(this.amount.minus(other.amount))
  }

  isLessThan(other: Money): boolean {
    return this.amount.lessThan(other.amount)
  }

  isNegative(): boolean {
    return this.amount.lessThan(0)
  }

  isZero(): boolean {
    return this.amount.isZero()
  }

  equals(other: Money): boolean {
    return this.amount.equals(other.amount)
  }

  /** Forma para persistir y mostrar: string con 2 decimales. */
  toString(): string {
    return this.amount.toFixed(2)
  }
}
