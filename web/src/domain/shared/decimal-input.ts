import { D, ROUND_HALF_UP } from '@/domain/shared/decimal'
import { err, ok } from '@/domain/shared/result'

import type { Dec } from '@/domain/shared/decimal'
import type { Result } from '@/domain/shared/result'

export type DecimalInputError =
  | { kind: 'NOT_A_NUMBER' }
  | { kind: 'NEGATIVE' }
  | { kind: 'TOO_MANY_DECIMALS'; maxDecimals: number }
  | { kind: 'TOO_LARGE'; max: string }

export interface DecimalLimits {
  /** Magnitud máxima (valor absoluto, inclusive) como string decimal plano. */
  max: string
  /** Decimales permitidos (strict) o a los que se redondea (rounded). */
  maxDecimals: number
}

// Acota el costo de procesar entradas hostiles. El valor legítimo más largo
// (22 enteros + 16 decimales + signo + punto) mide 40 caracteres.
const MAX_INPUT_LENGTH = 64

// Solo decimales planos. Sin exponentes, hex ni dígitos Unicode:
// decimal.js aceptaría "0x10" o "1e3" como números.
const PLAIN_DECIMAL = /^-?\d+(\.\d+)?$/

function parseBase(
  input: string | number,
  limits: DecimalLimits,
  allowNegative: boolean,
): Result<Dec, DecimalInputError> {
  let value: Dec

  if (typeof input === 'string') {
    if (input.length > MAX_INPUT_LENGTH) {
      return err({ kind: 'TOO_LARGE', max: limits.max })
    }

    const trimmed = input.trim()

    if (!PLAIN_DECIMAL.test(trimmed)) {
      return err({ kind: 'NOT_A_NUMBER' })
    }

    value = new D(trimmed)
  } else {
    value = new D(input)

    if (!value.isFinite()) {
      return err({ kind: 'NOT_A_NUMBER' })
    }
  }

  if (!allowNegative && value.lessThan(0)) {
    return err({ kind: 'NEGATIVE' })
  }

  if (value.abs().greaterThan(limits.max)) {
    return err({ kind: 'TOO_LARGE', max: limits.max })
  }

  return ok(allowNegative ? value : value.abs()) // abs() normaliza "-0" a 0
}

/** Rechaza si hay más decimales de los permitidos. Para entrada del usuario. */
export function parseStrict(
  input: string | number,
  limits: DecimalLimits,
): Result<Dec, DecimalInputError> {
  const base = parseBase(input, limits, false)
  if (!base.ok) return base

  if (base.value.decimalPlaces() > limits.maxDecimals) {
    return err({ kind: 'TOO_MANY_DECIMALS', maxDecimals: limits.maxDecimals })
  }

  return base
}

/** Redondea half-up. Para datos de mercado y montos. */
export function parseRounded(
  input: string | number,
  limits: DecimalLimits,
  options: { allowNegative?: boolean } = {},
): Result<Dec, DecimalInputError> {
  const base = parseBase(input, limits, options.allowNegative ?? false)
  if (!base.ok) return base

  return ok(base.value.toDecimalPlaces(limits.maxDecimals, ROUND_HALF_UP))
}
