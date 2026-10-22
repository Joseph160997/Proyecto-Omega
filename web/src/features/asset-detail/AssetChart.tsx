import { useEffect, useRef } from 'react'
import { CandlestickSeries, ColorType, createChart } from 'lightweight-charts'

import { useThemeStore } from '@/app/container'

import type { UTCTimestamp } from 'lightweight-charts'
import type { Candle } from '@/domain/market/candle'
import type { ThemeMode } from '@/domain/settings/theme'

// Canvas no lee variables CSS; se espeja la paleta de index.css (el efecto del hijo corre antes de aplicar la clase `dark`).
const PALETTE: Record<ThemeMode, { text: string; line: string; up: string; down: string }> = {
  light: { text: '#5c5446', line: 'rgba(60, 40, 10, 0.13)', up: '#0a6945', down: '#ae3020' },
  dark: { text: '#b2aa9d', line: 'rgba(255, 244, 230, 0.09)', up: '#5bd9a4', down: '#ff7a6b' },
}

export function AssetChart({ candles }: { candles: readonly Candle[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mode = useThemeStore((state) => state.mode)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const colors = PALETTE[mode]
    const chart = createChart(container, {
      autoSize: true,
      height: 320,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: colors.text,
        fontFamily: "'IBM Plex Mono', monospace",
      },
      grid: {
        vertLines: { color: colors.line },
        horzLines: { color: colors.line },
      },
      rightPriceScale: { borderColor: colors.line },
      timeScale: { borderColor: colors.line, timeVisible: true },
    })
    const series = chart.addSeries(CandlestickSeries, {
      upColor: colors.up,
      downColor: colors.down,
      borderUpColor: colors.up,
      borderDownColor: colors.down,
      wickUpColor: colors.up,
      wickDownColor: colors.down,
    })

    series.setData(
      candles.map((candle) => ({
        time: Math.floor(candle.time / 1000) as UTCTimestamp,
        open: Number(candle.open.toString()),
        high: Number(candle.high.toString()),
        low: Number(candle.low.toString()),
        close: Number(candle.close.toString()),
      })),
    )
    chart.timeScale().fitContent()

    return () => chart.remove()
  }, [candles, mode])

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Gráfico de velas OHLC del activo"
      className="h-80 min-w-0 w-full"
    />
  )
}
