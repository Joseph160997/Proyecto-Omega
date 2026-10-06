import type { AssetType } from '@/domain/market/asset'
import type { Price } from '@/domain/shared/price'

export type QuoteSource = 'coingecko' | 'binance' | 'finnhub' | 'twelvedata' | 'frankfurter'

/**
 * Núcleo mínimo que necesitan las reglas de trading. Markets lo ampliará
 * (nombre, cambio 24h, volumen...). Sin campo `stale`: es derivado, ver isQuoteStale.
 */
export interface Quote {
  readonly assetId: string
  readonly price: Price
  readonly timestamp: number // epoch en ms
  readonly source: QuoteSource
}

/**
 * Quote enriquecida para mostrar en la UI. Extiende Quote: cualquier MarketQuote
 * sirve para las reglas de trading. Todos los precios están en USD.
 *
 * Las estadísticas son `number`: son datos de visualización que nunca se
 * multiplican ni se suman en la contabilidad. No todo necesita un value object.
 */
export interface MarketQuote extends Quote {
  readonly symbol: string
  readonly name: string
  readonly type: AssetType
  readonly change24hPercent?: number // 2.35 significa +2.35%
  readonly volume24h?: number
  readonly marketCap?: number
}

export function quoteAgeMs(quote: Quote, now: number): number {
  return now - quote.timestamp
}

/** Una quote del futuro (reloj desajustado) no se considera vieja. */
export function isQuoteStale(quote: Quote, now: number, maxAgeMs: number): boolean {
  return quoteAgeMs(quote, now) > maxAgeMs
}
