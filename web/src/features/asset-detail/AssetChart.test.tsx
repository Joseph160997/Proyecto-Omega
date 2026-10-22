// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Price } from '@/domain/shared/price'
import { AssetChart } from '@/features/asset-detail/AssetChart'

import type { Candle } from '@/domain/market/candle'

const mocks = vi.hoisted(() => {
  const setData = vi.fn()
  const fitContent = vi.fn()
  const remove = vi.fn()
  const addSeries = vi.fn(() => ({ setData }))
  const chart = { addSeries, timeScale: () => ({ fitContent }), remove }
  const chartOptions: Array<{ layout: { textColor: string } }> = []

  return {
    createChart: vi.fn((_container: HTMLElement, options: { layout: { textColor: string } }) => {
      chartOptions.push(options)
      return chart
    }),
    chartOptions,
    setData,
    fitContent,
    remove,
    addSeries,
    mode: 'light' as 'light' | 'dark',
  }
})

vi.mock('lightweight-charts', () => ({
  CandlestickSeries: 'candlestick-series',
  ColorType: { Solid: 'solid' },
  createChart: mocks.createChart,
}))

vi.mock('@/app/container', () => ({
  useThemeStore: (selector: (state: { mode: 'light' | 'dark' }) => unknown) =>
    selector({ mode: mocks.mode }),
}))

const candles: Candle[] = [
  {
    time: 1_700_000_000_999,
    open: Price.of('1.25'),
    high: Price.of('2'),
    low: Price.of('1'),
    close: Price.of('1.75'),
  },
]

beforeEach(() => {
  mocks.mode = 'light'
  mocks.createChart.mockClear()
  mocks.chartOptions.length = 0
  mocks.setData.mockClear()
  mocks.fitContent.mockClear()
  mocks.remove.mockClear()
  mocks.addSeries.mockClear()
})

describe('AssetChart', () => {
  it('labels the chart for assistive technology and maps candles to chart values', () => {
    const { unmount } = render(<AssetChart candles={candles} />)

    expect(
      screen.getByRole('img', { name: 'Gráfico de velas OHLC del activo' }),
    ).toBeInTheDocument()
    expect(mocks.createChart).toHaveBeenCalledOnce()
    expect(mocks.addSeries).toHaveBeenCalledOnce()
    expect(mocks.setData).toHaveBeenCalledWith([
      { time: 1_700_000_000, open: 1.25, high: 2, low: 1, close: 1.75 },
    ])
    expect(mocks.fitContent).toHaveBeenCalledOnce()

    unmount()
    expect(mocks.remove).toHaveBeenCalledOnce()
  })

  it('uses the dark palette and recreates the chart when the theme changes', () => {
    const view = render(<AssetChart candles={candles} />)
    const lightOptions = mocks.chartOptions[0]

    mocks.mode = 'dark'
    view.rerender(<AssetChart candles={candles} />)

    const darkOptions = mocks.chartOptions[1]

    expect(lightOptions?.layout.textColor).toBe('#5c5446')
    expect(darkOptions?.layout.textColor).toBe('#b2aa9d')
    expect(mocks.createChart).toHaveBeenCalledTimes(2)
    expect(mocks.remove).toHaveBeenCalledOnce()
  })

  it('renders an empty candle series without skipping chart setup', () => {
    render(<AssetChart candles={[]} />)

    expect(mocks.setData).toHaveBeenCalledWith([])
    expect(mocks.fitContent).toHaveBeenCalledOnce()
  })
})
