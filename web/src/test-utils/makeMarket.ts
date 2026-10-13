import { Price } from '@/domain/shared/price'
import { makeQuote } from '@/test-utils/makeQuote'

import type { MarketQuote } from '@/domain/market/quote'

/**
 * Un mercado de `count` activos (coin01, coin02...), determinista:
 * capitalización descendente, precio ascendente, y sube/baja alternado
 * (los índices pares suben, los impares bajan).
 */
export function makeMarket(count: number): MarketQuote[] {
  return Array.from({ length: count }, (_, index) => {
    const id = `coin${String(index + 1).padStart(2, '0')}`

    return makeQuote(id, {
      price: Price.of(String(index + 1)),
      marketCap: 10_000 - index * 100,
      volume24h: 500 + ((index * 37) % 200),
      change24hPercent: index % 2 === 0 ? (index + 1) / 2 : -(index + 1) / 3,
    })
  })
}
