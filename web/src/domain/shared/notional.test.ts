import { describe, expect, it } from 'vitest'

import { Price, PRICE_MAX } from '@/domain/shared/price'
import { Quantity, QUANTITY_MAX } from '@/domain/shared/quantity'
import { notionalValue } from '@/domain/shared/notional'

describe('notionalValue', () => {
  it('the largest possible order does not break or lose precision', () => {
    const value = notionalValue(Quantity.of(QUANTITY_MAX), Price.of(PRICE_MAX))

    expect(value.toString()).toBe(`1${'0'.repeat(21)}.00`)
  })

  it('the exact product of two values at maximum precision does not lose digits', () => {
    const value = notionalValue(
      Quantity.of('999999999999.99999999'),
      Price.of('999999999.99999999'),
    )

    expect(value.toString()).toBe(`${'9'.repeat(16)}89990.00`)
  })
})
