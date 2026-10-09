import { describe, expect, it } from 'vitest'

import { Price, PRICE_MAX } from '@/domain/shared/price'

describe('Price.fromMarket', () => {
  it.each([
    [1, '1'],
    [0.125, '0.125'],
    [42.5, '42.5'],
  ])('accepts %j and normalizes it to %s', (input, expected) => {
    const result = Price.fromMarket(input)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.toString()).toBe(expected)
    }
  })

  it.each([
    [NaN, 'NOT_A_NUMBER'],
    [Infinity, 'NOT_A_NUMBER'],
    [1e10, 'TOO_LARGE'],
  ])('rejects %j with %s', (input, kind) => {
    const result = Price.fromMarket(input as number)

    expect(!result.ok && result.error.kind).toBe(kind)
  })
})

describe('Price', () => {
  it('serializes in canonical form', () => {
    expect(Price.of('1.50').toString()).toBe('1.5')
    expect(Price.of('2').toString()).toBe('2')
    expect(Price.of('0.00000001').toString()).toBe('0.00000001')
  })

  it('of rejects floating-point noise instead of accepting it', () => {
    expect(() => Price.of(0.1 + 0.2)).toThrow(RangeError)
  })

  it('igualdad y cero', () => {
    expect(Price.of('1').equals(Price.of('1.0'))).toBe(true)
    expect(Price.of('0').isZero()).toBe(true)
  })

  it('accepts the exact maximum', () => {
    expect(Price.of(PRICE_MAX).toString()).toBe('1000000000')
  })
})

describe('Price.compareTo', () => {
  it('compares numeric values, not their text representation', () => {
    expect(Price.of('9').compareTo(Price.of('10'))).toBeLessThan(0)
    expect(Price.of('10').compareTo(Price.of('9'))).toBeGreaterThan(0)
  })

  it('returns zero for equivalent values', () => {
    expect(Price.of('1.0').compareTo(Price.of('1'))).toBe(0)
  })

  it('distinguishes values through the eighth decimal place', () => {
    expect(Price.of('0.00000001').compareTo(Price.of('0.00000002'))).toBeLessThan(0)
  })
})
