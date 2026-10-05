import { parseRounded, parseStrict } from '@/domain/shared/decimal-input'
import { ok } from '@/domain/shared/result'

import type { DecimalInputError, DecimalLimits } from '@/domain/shared/decimal-input'
import type { Dec } from '@/domain/shared/decimal'
import type { Result } from '@/domain/shared/result'

export const PRICE_DECIMALS = 8
export const PRICE_MAX = '1000000000' // 1e9

const LIMITS: DecimalLimits = { max: PRICE_MAX, maxDecimals: PRICE_DECIMALS }

export class Price {
  private readonly value: Dec

  private constructor(value: Dec) {
    this.value = value
  }

  /** Dato de mercado (API): redondea a 8 decimales. */
  static fromMarket(input: number): Result<Price, DecimalInputError> {
    const parsed = parseRounded(input, LIMITS)
    return parsed.ok ? ok(new Price(parsed.value)) : parsed
  }

  /** Valores de confianza (persistidos, tests). Estricto: lanza si es inválido. */
  static of(input: string | number): Price {
    const parsed = parseStrict(input, LIMITS)

    if (!parsed.ok) {
      throw new RangeError(`Price inválido (${parsed.error.kind}): ${String(input)}`)
    }

    return new Price(parsed.value)
  }

  isZero(): boolean {
    return this.value.isZero()
  }

  equals(other: Price): boolean {
    return this.value.equals(other.value)
  }

  toString(): string {
    return this.value.toFixed()
  }
}
