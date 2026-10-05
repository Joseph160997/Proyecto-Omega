import { describe, expect, it } from 'vitest'

import { Price, PRICE_MAX } from '@/domain/shared/price'

describe('Price.fromMarket', () => {
  it.each([
    [1, '1'],
    [0.125, '0.125'],
    [42.5, '42.5'],
  ])('acepta %j y lo normaliza a %s', (input, expected) => {
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
  ])('rechaza %j con %s', (input, kind) => {
    const result = Price.fromMarket(input as number)

    expect(!result.ok && result.error.kind).toBe(kind)
  })
})

describe('Price', () => {
  it('serializa en forma canónica', () => {
    expect(Price.of('1.50').toString()).toBe('1.5')
    expect(Price.of('2').toString()).toBe('2')
    expect(Price.of('0.00000001').toString()).toBe('0.00000001')
  })

  it('of rechaza el ruido de punto flotante en vez de aceptarlo', () => {
    expect(() => Price.of(0.1 + 0.2)).toThrow(RangeError)
  })

  it('igualdad y cero', () => {
    expect(Price.of('1').equals(Price.of('1.0'))).toBe(true)
    expect(Price.of('0').isZero()).toBe(true)
  })

  it('acepta el máximo exacto', () => {
    expect(Price.of(PRICE_MAX).toString()).toBe('1000000000')
  })
})
