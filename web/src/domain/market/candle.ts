import { err, ok } from '@/domain/shared/result'

import type { Price } from '@/domain/shared/price'
import type { Result } from '@/domain/shared/result'

export interface Candle {
  readonly time: number
  readonly open: Price
  readonly high: Price
  readonly low: Price
  readonly close: Price
}

export type CandleError = { readonly kind: 'INVALID_TIMESTAMP' } | { readonly kind: 'INVALID_OHLC' }

export function createCandle(input: Candle): Result<Candle, CandleError> {
  if (!Number.isSafeInteger(input.time) || input.time < 0) {
    return err({ kind: 'INVALID_TIMESTAMP' })
  }

  if (
    input.high.compareTo(input.low) < 0 ||
    input.high.compareTo(input.open) < 0 ||
    input.high.compareTo(input.close) < 0 ||
    input.low.compareTo(input.open) > 0 ||
    input.low.compareTo(input.close) > 0
  ) {
    return err({ kind: 'INVALID_OHLC' })
  }

  return ok(input)
}
