import { describe, expect, it } from 'vitest'

import { Price } from '@/domain/shared/price'
import {
  formatCompactUsd,
  formatPercentChange,
  formatUsdPrice,
  percentChangeDirection,
} from '@/lib/format'

describe('formatUsdPrice', () => {
  it.each([
    ['85495', '$85,495.00'],
    ['2697.39', '$2,697.39'],
    ['1.5', '$1.50'],
    ['1', '$1.00'],
    ['0.335586', '$0.3356'],
    ['0.093406', '$0.0934'],
    ['0.01', '$0.0100'],
    ['0.00001234', '$0.00001234'],
    ['0.00000001', '$0.00000001'],
    ['0', '$0.00'],
    ['1000000000', '$1,000,000,000.00'],
  ])('%s -> %s', (input, expected) => {
    expect(formatUsdPrice(Price.of(input))).toBe(expected)
  })
})

describe('formatCompactUsd', () => {
  it.each([
    [1719979725824, '$1.72T'],
    [27330667563, '$27.33B'],
    [950, '$950'],
  ])('%s -> %s', (input, expected) => {
    expect(formatCompactUsd(input)).toBe(expected)
  })

  it.each([[undefined], [NaN], [Infinity]])('%s -> "—"', (input) => {
    expect(formatCompactUsd(input)).toBe('—')
  })
})

describe('formatPercentChange', () => {
  it.each([
    [2.35, '+2.35%'],
    [12.3456, '+12.35%'],
    [-0.36434, '-0.36%'],
    [0, '0.00%'],
    [0.004, '0.00%'],
    [-0.001, '0.00%'],
  ])('%s -> %s', (input, expected) => {
    expect(formatPercentChange(input)).toBe(expected)
  })

  it.each([[undefined], [NaN], [-Infinity]])('%s -> "—"', (input) => {
    expect(formatPercentChange(input)).toBe('—')
  })
})

describe('percentChangeDirection', () => {
  it.each([
    [2.35, 'up'],
    [0.01, 'up'],
    [-0.36, 'down'],
    [0, 'flat'],
    [0.004, 'flat'],
    [-0.004, 'flat'],
    [undefined, 'flat'],
    [NaN, 'flat'],
  ])('%s -> %s', (input, expected) => {
    expect(percentChangeDirection(input)).toBe(expected)
  })
})
