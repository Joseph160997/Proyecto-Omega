import { describe, expect, it } from 'vitest'

import { createCandle } from '@/domain/market/candle'
import { Price } from '@/domain/shared/price'

function makeInput(overrides: Partial<Parameters<typeof createCandle>[0]> = {}) {
  return {
    time: 1_700_000_000_000,
    open: Price.of('10'),
    high: Price.of('12'),
    low: Price.of('8'),
    close: Price.of('11'),
    ...overrides,
  }
}

describe('createCandle', () => {
  it('accepts valid OHLC values and preserves the input', () => {
    const input = makeInput()

    const result = createCandle(input)

    expect(result).toEqual({ ok: true, value: input })
  })

  it('allows zero timestamps and open/close values on the high-low boundaries', () => {
    const input = makeInput({
      time: 0,
      open: Price.of('8'),
      high: Price.of('12'),
      low: Price.of('8'),
      close: Price.of('12'),
    })

    const result = createCandle(input)

    expect(result).toEqual({ ok: true, value: input })
  })

  it.each([
    ['negative', -1],
    ['fractional', 1.5],
    ['unsafe', Number.MAX_SAFE_INTEGER + 1],
    ['NaN', Number.NaN],
    ['infinite', Number.POSITIVE_INFINITY],
  ])('rejects a %s timestamp', (_label, time) => {
    const result = createCandle(makeInput({ time }))

    expect(result).toEqual({ ok: false, error: { kind: 'INVALID_TIMESTAMP' } })
  })

  it.each([
    ['high below low', { high: Price.of('7') }],
    ['high below open', { open: Price.of('13') }],
    ['high below close', { close: Price.of('13') }],
    ['low above open', { low: Price.of('11') }],
    ['low above close', { low: Price.of('12') }],
  ])('rejects OHLC values when %s', (_label, overrides) => {
    const result = createCandle(makeInput(overrides))

    expect(result).toEqual({ ok: false, error: { kind: 'INVALID_OHLC' } })
  })
})
