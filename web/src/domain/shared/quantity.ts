import { parseStrict } from '@/domain/shared/decimal-input'
import { ok } from '@/domain/shared/result'

import type { DecimalInputError } from '@/domain/shared/decimal-input'
import type { Dec } from '@/domain/shared/decimal'
import type { Result } from '@/domain/shared/result'

export const QUANTITY_DECIMALS = 8

export class Quantity {
  private readonly value: Dec

  private constructor(value: Dec) {
    this.value = value
  }

  /** Entrada no confiable (formularios). Devuelve el motivo si es inválida. */
  static parse(input: string): Result<Quantity, DecimalInputError> {
    const parsed = parseStrict(input, QUANTITY_DECIMALS)
    return parsed.ok ? ok(new Quantity(parsed.value)) : parsed
  }

  /** Valores de confianza (tests, datos ya validados). Lanza si son inválidos. */
  static of(input: string | number): Quantity {
    const parsed = parseStrict(input, QUANTITY_DECIMALS)

    if (!parsed.ok) {
      throw new RangeError(`Quantity inválida (${parsed.error.kind}): ${String(input)}`)
    }

    return new Quantity(parsed.value)
  }

  static zero(): Quantity {
    return Quantity.of(0)
  }

  add(other: Quantity): Quantity {
    return new Quantity(this.value.plus(other.value))
  }

  /** Lanza si el resultado sería negativo: quien llama debe comprobarlo antes. */
  subtract(other: Quantity): Quantity {
    const result = this.value.minus(other.value)

    if (result.lessThan(0)) {
      throw new RangeError('Quantity no puede ser negativa')
    }

    return new Quantity(result)
  }

  isZero(): boolean {
    return this.value.isZero()
  }

  isLessThan(other: Quantity): boolean {
    return this.value.lessThan(other.value)
  }

  equals(other: Quantity): boolean {
    return this.value.equals(other.value)
  }

  /** Forma canónica para persistir: sin ceros sobrantes ni exponentes ("0.00231"). */
  toString(): string {
    return this.value.toFixed()
  }
}
