import { D, ROUND_HALF_UP } from '@/domain/shared/decimal'

import type { Dec } from '@/domain/shared/decimal'

export type CurrencyCode = 'USD'

export class Money {
  readonly currency: CurrencyCode = 'USD'
  private readonly amount: Dec

  private constructor(amount: Dec) {
    this.amount = amount
  }

  /** Acepta string (preferido) o number. Lanza si el valor no es un número finito. */
  static usd(value: string | number): Money {
    const parsed = new D(value) // lanza DecimalError si el string no es numérico

    if (!parsed.isFinite()) {
      throw new RangeError(`Money inválido: ${String(value)}`)
    }

    return new Money(parsed.toDecimalPlaces(2, ROUND_HALF_UP))
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
