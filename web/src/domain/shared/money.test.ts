import { describe, expect, it } from 'vitest'

import { MONEY_MAX, Money } from '@/domain/shared/money'

describe('Money', () => {
  describe('precision', () => {
    it('avoids the floating-point issue of number', () => {
      expect(0.1 + 0.2).not.toBe(0.3) // the problem we solve
      expect(Money.usd('0.1').add(Money.usd('0.2')).toString()).toBe('0.30')
    })
  })

  describe('rounding to cents (half-up)', () => {
    it('rounds up from the exact midpoint', () => {
      expect(Money.usd('1.005').toString()).toBe('1.01')
    })

    it('rounds down below the midpoint', () => {
      expect(Money.usd('1.004').toString()).toBe('1.00')
    })

    it('for negatives it rounds away from zero', () => {
      expect(Money.usd('-1.005').toString()).toBe('-1.01')
    })
  })

  describe('arithmetic', () => {
    it('adds and subtracts', () => {
      expect(Money.usd(10).add(Money.usd('2.50')).toString()).toBe('12.50')
      expect(Money.usd(10).subtract(Money.usd('2.50')).toString()).toBe('7.50')
    })

    it('subtraction can go negative', () => {
      const result = Money.usd(5).subtract(Money.usd(8))

      expect(result.toString()).toBe('-3.00')
      expect(result.isNegative()).toBe(true)
    })

    it('is immutable: operations return a new value', () => {
      const original = Money.usd(10)
      original.add(Money.usd(5))

      expect(original.toString()).toBe('10.00')
    })
  })

  describe('comparison', () => {
    it('equals ignores how the value was written', () => {
      expect(Money.usd('10').equals(Money.usd('10.00'))).toBe(true)
    })

    it('isLessThan', () => {
      expect(Money.usd(5).isLessThan(Money.usd(8))).toBe(true)
      expect(Money.usd(8).isLessThan(Money.usd(5))).toBe(false)
    })

    it('zero and isZero', () => {
      expect(Money.zero().isZero()).toBe(true)
      expect(Money.usd('0.00').equals(Money.zero())).toBe(true)
      expect(Money.usd('0.01').isZero()).toBe(false)
    })
  })

  describe('invalid input', () => {
    it.each([
      ['abc'],
      [''],
      [NaN],
      [Infinity],
      [-Infinity],
      ['0x10'],
      ['1e3'],
      ['１２'],
      ['9'.repeat(10_000)],
      [`1${'0'.repeat(23)}`],
    ])('rejects %j', (input) => {
      expect(() => Money.usd(input)).toThrow(RangeError)
    })

    it('accepts the exact maximum, positive and negative', () => {
      expect(Money.usd(MONEY_MAX).toString()).toBe(`1${'0'.repeat(22)}.00`)
      expect(Money.usd(`-${MONEY_MAX}`).isNegative()).toBe(true)
    })

    it('a negative that rounds to zero is not kept as "-0.00"', () => {
      expect(Money.usd('-0.004').toString()).toBe('0.00')
    })
  })
})
