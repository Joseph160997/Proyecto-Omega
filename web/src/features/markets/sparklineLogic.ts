import { percentChangeDirection } from '@/lib/format'

import type { ChangeDirection } from '@/lib/format'

export const SPARKLINE_MAX_POINTS = 48

export function downsample(values: readonly number[], maxPoints: number): number[] {
  if (maxPoints < 2) throw new RangeError('maxPoints must be at least 2')
  if (values.length <= maxPoints) return [...values]

  const last = values.length - 1
  const picked = new Set<number>()

  for (let i = 0; i < maxPoints; i += 1) {
    picked.add(Math.round((i * last) / (maxPoints - 1)))
  }

  return values.filter((_, index) => picked.has(index))
}

export function buildSparklinePath(
  values: readonly number[],
  width: number,
  height: number,
  padding = 2,
): string | null {
  const innerWidth = width - 2 * padding
  const innerHeight = height - 2 * padding

  if (innerWidth <= 0 || innerHeight <= 0) {
    throw new RangeError('Drawing area must be larger than the padding')
  }

  const points = downsample(values.filter(Number.isFinite), SPARKLINE_MAX_POINTS)

  if (points.length < 2) return null

  const min = Math.min(...points)
  const range = Math.max(...points) - min
  const stepX = innerWidth / (points.length - 1)

  return points
    .map((value, index) => {
      const x = padding + index * stepX
      const y = range === 0 ? height / 2 : padding + innerHeight * (1 - (value - min) / range)

      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

export interface SparklineTrend {
  direction: ChangeDirection
  changePercent: number | undefined
}

export function sparklineTrend(values: readonly number[]): SparklineTrend {
  const finite = values.filter(Number.isFinite)
  const first = finite.at(0)
  const last = finite.at(-1)

  if (finite.length < 2 || first === undefined || last === undefined || first === 0) {
    return { direction: 'flat', changePercent: undefined }
  }

  const changePercent = ((last - first) / Math.abs(first)) * 100

  return { direction: percentChangeDirection(changePercent), changePercent }
}
