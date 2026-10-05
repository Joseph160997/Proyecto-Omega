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

export function quoteAgeMs(quote: Quote, now: number): number {
  return now - quote.timestamp
}

/** Una quote del futuro (reloj desajustado) no se considera vieja. */
export function isQuoteStale(quote: Quote, now: number, maxAgeMs: number): boolean {
  return quoteAgeMs(quote, now) > maxAgeMs
}
