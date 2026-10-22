import { CANDLE_TIMEFRAMES } from '@/domain/market/candleTimeframe'

import type { CandleTimeframe } from '@/domain/market/candleTimeframe'

const LABELS: Readonly<Record<CandleTimeframe, string>> = {
  '1d': '1D',
  '7d': '7D',
  '30d': '30D',
  '90d': '90D',
  '1y': '1A',
}

export function TimeframeSelector({
  value,
  onChange,
}: {
  value: CandleTimeframe
  onChange: (timeframe: CandleTimeframe) => void
}) {
  return (
    <div
      role="group"
      aria-label="Periodo del gráfico"
      className="inline-flex h-9 items-stretch rounded-xl border border-line bg-panel p-1"
    >
      {CANDLE_TIMEFRAMES.map((timeframe) => (
        <button
          key={timeframe}
          type="button"
          aria-pressed={value === timeframe}
          onClick={() => onChange(timeframe)}
          className={`min-w-10 rounded-lg px-3 text-xs font-medium transition-colors ${value === timeframe ? 'bg-raised text-fg' : 'text-fg-muted hover:text-fg'}`}
        >
          {LABELS[timeframe]}
        </button>
      ))}
    </div>
  )
}
