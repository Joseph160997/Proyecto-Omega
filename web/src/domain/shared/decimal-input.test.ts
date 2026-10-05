import { describe, expect, it } from 'vitest'

import { parseRounded, parseStrict } from '@/domain/shared/decimal-input'

const LIMITS = { max: '1000', maxDecimals: 2 }

describe('parseStrict: hostile inputs', () => {
  it('rejects giant strings without processing them', () => {
    const result = parseStrict('9'.repeat(10_000), LIMITS)

    expect(!result.ok && result.error.kind).toBe('TOO_LARGE')
  })

  it('rejects huge strings disguised as decimals', () => {
    const result = parseStrict(`0.${'1'.repeat(10_000)}`, LIMITS)

    expect(!result.ok && result.error.kind).toBe('TOO_LARGE')
  })

  it.each([
    ['1e999'],
    ['1e3'],
    ['0x10'],
    ['0b11'],
    ['Infinity'],
    ['NaN'],
    ['+5'],
    ['1_000'],
    ['５５'],
    ['٣'],
    [' '],
    ['5 5'],
  ])('rejects %j as NOT_A_NUMBER', (input) => {
    const result = parseStrict(input, LIMITS)

    expect(!result.ok && result.error.kind).toBe('NOT_A_NUMBER')
  })

  it('the maximum is inclusive', () => {
    expect(parseStrict('1000', LIMITS).ok).toBe(true)
    expect(parseStrict('1000.01', LIMITS).ok).toBe(false)
  })

  it('magnitude is checked before decimals', () => {
    const result = parseStrict('1000.001', LIMITS)

    expect(!result.ok && result.error.kind).toBe('TOO_LARGE')
  })

  it('rejects out-of-range or non-finite numbers', () => {
    const huge = parseStrict(1e300, LIMITS)
    const inf = parseStrict(Infinity, LIMITS)

    expect(!huge.ok && huge.error.kind).toBe('TOO_LARGE')
    expect(!inf.ok && inf.error.kind).toBe('NOT_A_NUMBER')
  })

  it('normalizes -0 to 0', () => {
    const result = parseStrict(-0, LIMITS)

    expect(result.ok && result.value.toString()).toBe('0')
  })
})

describe('parseRounded', () => {
  it('rounds half-up to the decimal precision limit', () => {
    const result = parseRounded('5.005', LIMITS)

    expect(result.ok && result.value.toString()).toBe('5.01')
  })

  it('rejects negatives by default', () => {
    const result = parseRounded('-5', LIMITS)

    expect(!result.ok && result.error.kind).toBe('NEGATIVE')
  })

  it('accepts negatives when requested, while respecting the maximum', () => {
    const ok = parseRounded('-5.005', LIMITS, { allowNegative: true })
    const tooBig = parseRounded('-1000.01', LIMITS, { allowNegative: true })

    expect(ok.ok && ok.value.toString()).toBe('-5.01')
    expect(!tooBig.ok && tooBig.error.kind).toBe('TOO_LARGE')
  })
})
