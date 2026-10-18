import { describe, expect, it } from 'vitest'

import { Money } from '@/domain/shared/money'
import { prorate, unitCost } from '@/domain/shared/prorate'
import { Quantity } from '@/domain/shared/quantity'

describe('prorate', () => {
  it('calculates the proportional amount', () => {
    expect(prorate(Money.usd('5005.00'), Quantity.of('0.05'), Quantity.of('0.1')).toString()).toBe(
      '2502.50',
    )
  })

  it('rounds half-up to cents', () => {
    // 100.01 / 3 = 33.3366… → 33.34.
    expect(prorate(Money.usd('100.01'), Quantity.of('1'), Quantity.of('3')).toString()).toBe(
      '33.34',
    )
    // 66.67 / 2 = 33.335 → 33.34 (an exact midpoint rounds up).
    expect(prorate(Money.usd('66.67'), Quantity.of('1'), Quantity.of('2')).toString()).toBe('33.34')
  })

  it('returns the full amount when the part equals the whole', () => {
    expect(prorate(Money.usd('123.45'), Quantity.of('7'), Quantity.of('7')).toString()).toBe(
      '123.45',
    )
  })

  it('returns zero when the part is zero', () => {
    expect(prorate(Money.usd('50'), Quantity.zero(), Quantity.of('3')).toString()).toBe('0.00')
  })

  it('throws when the whole is zero', () => {
    expect(() => prorate(Money.usd('1'), Quantity.of('1'), Quantity.zero())).toThrow(RangeError)
  })
})

describe('unitCost', () => {
  it('calculates cost divided by quantity', () => {
    expect(unitCost(Money.usd('5005.00'), Quantity.of('0.1')).toString()).toBe('50050')
  })

  it('rounds to eight decimal places', () => {
    expect(unitCost(Money.usd('100.00'), Quantity.of('3')).toString()).toBe('33.33333333')
  })

  it('throws when the quantity is zero', () => {
    expect(() => unitCost(Money.usd('1'), Quantity.zero())).toThrow(RangeError)
  })
})
