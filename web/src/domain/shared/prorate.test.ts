import { describe, expect, it } from 'vitest'

import { Money } from '@/domain/shared/money'
import { prorate, unitCost } from '@/domain/shared/prorate'
import { Quantity } from '@/domain/shared/quantity'

describe('prorate', () => {
  it('calcula la parte proporcional', () => {
    expect(prorate(Money.usd('5005.00'), Quantity.of('0.05'), Quantity.of('0.1')).toString()).toBe(
      '2502.50',
    )
  })

  it('redondea half-up a centavos', () => {
    // 100.01 / 3 = 33.3366… → 33.34
    expect(prorate(Money.usd('100.01'), Quantity.of('1'), Quantity.of('3')).toString()).toBe(
      '33.34',
    )
    // 66.67 / 2 = 33.335 → 33.34 (justo en la mitad, sube)
    expect(prorate(Money.usd('66.67'), Quantity.of('1'), Quantity.of('2')).toString()).toBe('33.34')
  })

  it('una parte igual al total devuelve el monto entero', () => {
    expect(prorate(Money.usd('123.45'), Quantity.of('7'), Quantity.of('7')).toString()).toBe(
      '123.45',
    )
  })

  it('una parte cero da cero', () => {
    expect(prorate(Money.usd('50'), Quantity.zero(), Quantity.of('3')).toString()).toBe('0.00')
  })

  it('un total cero es un error de uso', () => {
    expect(() => prorate(Money.usd('1'), Quantity.of('1'), Quantity.zero())).toThrow(RangeError)
  })
})

describe('unitCost', () => {
  it('es el costo dividido entre la cantidad', () => {
    expect(unitCost(Money.usd('5005.00'), Quantity.of('0.1')).toString()).toBe('50050')
  })

  it('redondea a 8 decimales', () => {
    expect(unitCost(Money.usd('100.00'), Quantity.of('3')).toString()).toBe('33.33333333')
  })

  it('una cantidad cero es un error de uso', () => {
    expect(() => unitCost(Money.usd('1'), Quantity.zero())).toThrow(RangeError)
  })
})
