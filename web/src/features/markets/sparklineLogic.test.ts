import { describe, expect, it } from 'vitest'

import {
  buildSparklinePath,
  downsample,
  SPARKLINE_MAX_POINTS,
  sparklineTrend,
} from '@/features/markets/sparklineLogic'

describe('downsample', () => {
  it('returns a copy when the series already fits', () => {
    const values = [1, 2, 3]
    const result = downsample(values, 10)

    expect(result).toEqual([1, 2, 3])
    expect(result).not.toBe(values)
  })

  it('samples evenly and preserves the first and last points', () => {
    expect(downsample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 4)).toEqual([0, 3, 6, 9])
  })

  it('reduces 168 hourly points to the maximum', () => {
    const week = Array.from({ length: 168 }, (_, index) => index)
    const result = downsample(week, SPARKLINE_MAX_POINTS)

    expect(result).toHaveLength(SPARKLINE_MAX_POINTS)
    expect(result[0]).toBe(0)
    expect(result.at(-1)).toBe(167)
  })

  it('rejects a maximum smaller than 2', () => {
    expect(() => downsample([1, 2, 3], 1)).toThrow(RangeError)
  })
})

describe('buildSparklinePath', () => {
  it('draws an increase from the bottom to the top', () => {
    expect(buildSparklinePath([0, 10], 100, 20)).toBe('M2.0 18.0 L98.0 2.0')
  })

  it('draws a decrease from the top to the bottom', () => {
    expect(buildSparklinePath([10, 0], 100, 20)).toBe('M2.0 2.0 L98.0 18.0')
  })

  it('draws a flat series through the vertical center', () => {
    expect(buildSparklinePath([5, 5, 5], 100, 20)).toBe('M2.0 10.0 L50.0 10.0 L98.0 10.0')
  })

  it('ignores non-finite values', () => {
    expect(buildSparklinePath([NaN, 0, Infinity, 10], 100, 20)).toBe(
      buildSparklinePath([0, 10], 100, 20),
    )
  })

  it.each([[[]], [[5]], [[NaN, NaN]]])('returns null when %j has no drawable line', (values) => {
    expect(buildSparklinePath(values, 100, 20)).toBeNull()
  })

  it('throws when the drawing area is smaller than its padding', () => {
    expect(() => buildSparklinePath([1, 2], 3, 20, 2)).toThrow(RangeError)
  })

  it('limits long series to SPARKLINE_MAX_POINTS', () => {
    const week = Array.from({ length: 168 }, (_, index) => Math.sin(index / 10))
    const path = buildSparklinePath(week, 96, 32) ?? ''

    expect(
      path.split(' ').filter((part) => part.startsWith('M') || part.startsWith('L')),
    ).toHaveLength(SPARKLINE_MAX_POINTS)
  })
})

describe('sparklineTrend', () => {
  it('detects an increase and calculates the percentage', () => {
    const trend = sparklineTrend([100, 90, 110])

    expect(trend.direction).toBe('up')
    expect(trend.changePercent).toBeCloseTo(10)
  })

  it('detects a decrease', () => {
    const trend = sparklineTrend([100, 110, 90])

    expect(trend.direction).toBe('down')
    expect(trend.changePercent).toBeCloseTo(-10)
  })

  it('treats a displayed 0.00% change as flat', () => {
    expect(sparklineTrend([100, 100.0001]).direction).toBe('flat')
  })

  it.each([[[]], [[5]], [[0, 10]], [[NaN, 5]]])('cannot calculate a trend for %j', (values) => {
    expect(sparklineTrend(values)).toEqual({ direction: 'flat', changePercent: undefined })
  })
})
