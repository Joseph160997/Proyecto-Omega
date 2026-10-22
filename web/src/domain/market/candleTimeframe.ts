export const CANDLE_TIMEFRAMES = ['1d', '7d', '30d', '90d', '1y'] as const

export type CandleTimeframe = (typeof CANDLE_TIMEFRAMES)[number]

export const COINGECKO_CANDLE_DAYS: Readonly<Record<CandleTimeframe, string>> = {
  '1d': '1',
  '7d': '7',
  '30d': '30',
  '90d': '90',
  '1y': '365',
}

export function isCandleTimeframe(value: string | null): value is CandleTimeframe {
  return CANDLE_TIMEFRAMES.some((timeframe) => timeframe === value)
}
