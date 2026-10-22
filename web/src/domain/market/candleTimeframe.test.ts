import { describe, expect, it } from 'vitest'

import {
  CANDLE_TIMEFRAMES,
  COINGECKO_CANDLE_DAYS,
  isCandleTimeframe,
} from '@/domain/market/candleTimeframe'

describe('CANDLE_TIMEFRAMES', () => {
  it('contains every supported period in display order', () => {
    expect(CANDLE_TIMEFRAMES).toEqual(['1d', '7d', '30d', '90d', '1y'])
  })

  it('maps each period to the CoinGecko days parameter', () => {
    expect(COINGECKO_CANDLE_DAYS).toEqual({
      '1d': '1',
      '7d': '7',
      '30d': '30',
      '90d': '90',
      '1y': '365',
    })
  })
})

describe('isCandleTimeframe', () => {
  it.each(CANDLE_TIMEFRAMES)('accepts %s', (timeframe) => {
    expect(isCandleTimeframe(timeframe)).toBe(true)
  })

  it.each([null, '', '1D', '365d', '2d', '7d/'])('rejects %s', (value) => {
    expect(isCandleTimeframe(value)).toBe(false)
  })
})
