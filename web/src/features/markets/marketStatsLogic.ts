import { percentChangeDirection } from '@/lib/format'

import type { MarketQuote } from '@/domain/market/quote'

const isPositive = (value: number | undefined): value is number =>
  value !== undefined && Number.isFinite(value) && value > 0

/** Volumen entre capitalización: qué parte del valor de la moneda se movió en 24 h. */
export function turnoverRatio(quote: MarketQuote): number | undefined {
  const { volume24h, marketCap } = quote

  if (volume24h === undefined || !Number.isFinite(volume24h)) return undefined
  if (!isPositive(marketCap)) return undefined

  return volume24h / marketCap
}

export interface MarketSummary {
  assetCount: number
  /** Suma solo de los que tienen capitalización válida. */
  totalMarketCap: number
  totalVolume24h: number
  rising: number
  falling: number
  /** Sin cambio visible (se muestra 0.00%) o sin dato. */
  flat: number
  /** El de mayor capitalización y su cuota sobre la suma del conjunto (0 a 1). */
  leader?: { assetId: string; symbol: string; share: number }
}

export function summarize(quotes: readonly MarketQuote[]): MarketSummary {
  let totalMarketCap = 0
  let totalVolume24h = 0
  let rising = 0
  let falling = 0
  let leader: MarketQuote | undefined

  for (const quote of quotes) {
    const { marketCap, volume24h } = quote

    if (isPositive(marketCap)) {
      totalMarketCap += marketCap

      if (leader === undefined || marketCap > (leader.marketCap ?? 0)) leader = quote
    }

    if (isPositive(volume24h)) totalVolume24h += volume24h

    // Mismo criterio que la pantalla: -0.004 se ve "0.00%" y cuenta como plano.
    const direction = percentChangeDirection(quote.change24hPercent)

    if (direction === 'up') rising += 1
    else if (direction === 'down') falling += 1
  }

  return {
    assetCount: quotes.length,
    totalMarketCap,
    totalVolume24h,
    rising,
    falling,
    flat: quotes.length - rising - falling,
    leader:
      leader === undefined || totalMarketCap === 0
        ? undefined
        : {
            assetId: leader.assetId,
            symbol: leader.symbol,
            share: (leader.marketCap ?? 0) / totalMarketCap,
          },
  }
}
