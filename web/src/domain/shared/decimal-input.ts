import { D, ROUND_HALF_UP } from '@/domain/shared/decimal'
import { err, ok } from '@/domain/shared/result'

import type { Dec } from '@/domain/shared/decimal'
import type { Result } from '@/domain/shared/result'

export type DecimalInputError =
  | { kind: 'NOT_A_NUMBER' }
  | { kind: 'NEGATIVE' }
  | { kind: 'TOO_MANY_DECIMALS'; maxDecimals: number }

// Solo decimales planos. Sin exponentes ni hex: decimal.js aceptaría "0x10" como número.
const PLAIN_DECIMAL = /^-?\d+(\.\d+)?$/

function toDecimal(input: string | number): Dec | null {
  if (typeof input === 'string') {
    const trimmed = input.trim()
    return PLAIN_DECIMAL.test(trimmed) ? new D(trimmed) : null
  }

  const value = new D(input)
  return value.isFinite() ? value : null
}

function toNonNegative(input: string | number): Result<Dec, DecimalInputError> {
  const value = toDecimal(input)

  if (value === null) return err({ kind: 'NOT_A_NUMBER' })
  if (value.lessThan(0)) return err({ kind: 'NEGATIVE' })

  return ok(value.abs()) // normaliza "-0" a 0
}

/** Rechaza si hay más decimales de los permitidos. Para entrada del usuario. */
export function parseStrict(
  input: string | number,
  maxDecimals: number,
): Result<Dec, DecimalInputError> {
  const base = toNonNegative(input)
  if (!base.ok) return base

  if (base.value.decimalPlaces() > maxDecimals) {
    return err({ kind: 'TOO_MANY_DECIMALS', maxDecimals })
  }

  return base
}

/** Redondea half-up al límite de decimales. Para datos de mercado. */
export function parseRounded(
  input: string | number,
  decimals: number,
): Result<Dec, DecimalInputError> {
  const base = toNonNegative(input)
  if (!base.ok) return base

  return ok(base.value.toDecimalPlaces(decimals, ROUND_HALF_UP))
}
