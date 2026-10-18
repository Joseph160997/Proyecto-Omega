import { parseRounded, parseStrict } from '@/domain/shared/decimal-input'

import type { Dec } from '@/domain/shared/decimal'
import type { DecimalInputError, DecimalLimits } from '@/domain/shared/decimal-input'
import type { Result } from '@/domain/shared/result'

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

  /**
   * Entrada no confiable (disco, formularios). No lanza y NO redondea: más de 2 decimales
   * o un valor negativo se rechazan, para que lo que se lee sea exactamente lo que se escribió.
   */
  static parse(input: string): Result<Money, DecimalInputError> {
    const parsed = parseStrict(input, MONEY_LIMITS)

    return parsed.ok ? { ok: true, value: new Money(parsed.value) } : parsed
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

  /** Aplica un porcentaje en puntos básicos (10 = 0.1%) y redondea a centavos. */
  applyBasisPoints(bps: number): Money {
    if (!Number.isInteger(bps) || bps < 0 || bps > 10_000) {
      throw new RangeError(`Puntos básicos inválidos: ${String(bps)}`)
    }

    return Money.usd(this.amount.times(bps).dividedBy(10_000).toFixed())
  }

  /** Forma para persistir y mostrar: string con 2 decimales. */
  toString(): string {
    return this.amount.toFixed(2)
  }
}
