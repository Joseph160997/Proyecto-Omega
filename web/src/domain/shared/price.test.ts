import { describe, expect, it } from 'vitest'

import { Quantity } from '@/domain/shared/quantity'

describe('Quantity.parse', () => {
  it.each([['0.00231'], ['1'], ['0'], ['  2.5  '], ['0.12345678']])('acepta %j', (input) => {
    expect(Quantity.parse(input).ok).toBe(true)
  })

  it.each([
    ['', 'NOT_A_NUMBER'],
    ['abc', 'NOT_A_NUMBER'],
    ['1,5', 'NOT_A_NUMBER'],
    ['0x10', 'NOT_A_NUMBER'],
    ['1e3', 'NOT_A_NUMBER'],
    ['-1', 'NEGATIVE'],
    ['0.123456789', 'TOO_MANY_DECIMALS'],
  ])('rechaza %j con %s', (input, kind) => {
    const result = Quantity.parse(input)

    expect(!result.ok && result.error.kind).toBe(kind)
  })

  it('informa el máximo de decimales permitido', () => {
    expect(Quantity.parse('0.123456789')).toEqual({
      ok: false,
      error: { kind: 'TOO_MANY_DECIMALS', maxDecimals: 8 },
    })
  })
})

describe('Quantity', () => {
  it('serializa en forma canónica', () => {
    expect(Quantity.of('1.50').toString()).toBe('1.5')
    expect(Quantity.of('2').toString()).toBe('2')
    expect(Quantity.of('0.00000001').toString()).toBe('0.00000001')
  })

  it('of rechaza el ruido de punto flotante en vez de aceptarlo', () => {
    expect(() => Quantity.of(0.1 + 0.2)).toThrow(RangeError)
  })

  it('suma y resta', () => {
    expect(Quantity.of('0.1').add(Quantity.of('0.2')).toString()).toBe('0.3')
    expect(Quantity.of('1').subtract(Quantity.of('0.25')).toString()).toBe('0.75')
  })

  it('subtract lanza si el resultado sería negativo', () => {
    expect(() => Quantity.of('1').subtract(Quantity.of('2'))).toThrow(RangeError)
  })

  it('compara', () => {
    expect(Quantity.of('1').isLessThan(Quantity.of('2'))).toBe(true)
    expect(Quantity.of('1.0').equals(Quantity.of('1'))).toBe(true)
    expect(Quantity.zero().isZero()).toBe(true)
  })

  it('es inmutable', () => {
    const original = Quantity.of('1')
    original.add(Quantity.of('1'))

    expect(original.toString()).toBe('1')
  })
})
