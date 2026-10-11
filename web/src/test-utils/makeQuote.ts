import { Price } from '@/domain/shared/price'

import type { MarketQuote } from '@/domain/market/quote'

/**  Crea una cita de mercado con un precio de 1. */
export function makeQuote(id: string, overrides: Partial<MarketQuote> = {}): MarketQuote {
  return {
    assetId: `crypto:${id}`,
    price: Price.of('1'),
    timestamp: 1_700_000_000_000,
    source: 'coingecko',
    symbol: id.toUpperCase(),
    name: id,
    type: 'crypto',
    ...overrides,
  }
}
