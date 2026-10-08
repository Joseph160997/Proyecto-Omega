import { z } from 'zod'

import { failAll } from '@/application/market/quotes-result'
import { makeAssetId } from '@/domain/market/asset'
import { Price } from '@/domain/shared/price'
import { err, ok } from '@/domain/shared/result'
import {
  CoinGeckoItemIdentitySchema,
  CoinGeckoMarketItemSchema,
} from '@/services/api/providers/coingecko/coingeckoSchema'

import type { MarketDataError } from '@/application/market/errors'
import type { MarketListing, QuoteFailure, QuotesResult } from '@/application/market/quotes-result'
import type { MarketQuote } from '@/domain/market/quote'
import type { Result } from '@/domain/shared/result'

const INVALID_RESPONSE: MarketDataError = { kind: 'INVALID_RESPONSE' }

function mapItem(raw: unknown, assetId: string): Result<MarketQuote, MarketDataError> {
  const parsed = CoinGeckoMarketItemSchema.safeParse(raw)
  if (!parsed.success) return err(INVALID_RESPONSE)

  const item = parsed.data
  if (item.current_price === null) return err(INVALID_RESPONSE)

  const price = Price.fromMarket(item.current_price)
  if (!price.ok) return err(INVALID_RESPONSE)

  const timestamp = Date.parse(item.last_updated)
  if (Number.isNaN(timestamp)) return err(INVALID_RESPONSE)

  return ok({
    assetId,
    price: price.value,
    timestamp,
    source: 'coingecko',
    symbol: item.symbol.toUpperCase(),
    name: item.name,
    type: 'crypto',
    change24hPercent: item.price_change_percentage_24h ?? undefined,
    volume24h: item.total_volume ?? undefined,
    marketCap: item.market_cap ?? undefined,
  })
}

/**
 * Convierte la respuesta cruda de /coins/markets en un QuotesResult.
 * `requested` traduce id de CoinGecko → assetId canónico.
 *
 * Garantiza el contrato del puerto: cada assetId pedido aparece exactamente una
 * vez, en `quotes` o en `failures`, sea cual sea el contenido de `body`.
 */
export function mapCoinGeckoMarkets(
  body: unknown,
  requested: ReadonlyMap<string, string>,
): QuotesResult {
  const envelope = z.array(z.unknown()).safeParse(body)

  if (!envelope.success) {
    return failAll([...requested.values()], INVALID_RESPONSE)
  }

  const quotes: MarketQuote[] = []
  const failures: QuoteFailure[] = []
  const answered = new Set<string>()

  for (const raw of envelope.data) {
    const identity = CoinGeckoItemIdentitySchema.safeParse(raw)
    if (!identity.success) continue

    const assetId = requested.get(identity.data.id)

    // Ignora monedas que no pedimos y repetidas: gana la primera.
    if (assetId === undefined || answered.has(assetId)) continue

    answered.add(assetId)

    const mapped = mapItem(raw, assetId)

    if (mapped.ok) {
      quotes.push(mapped.value)
    } else {
      failures.push({ assetId, error: mapped.error })
    }
  }

  for (const assetId of requested.values()) {
    if (!answered.has(assetId)) {
      failures.push({ assetId, error: { kind: 'UNSUPPORTED_ASSET', assetId } })
    }
  }

  return { quotes, failures }
}

/**
 * Convierte la respuesta de /coins/markets (top N) en un listado.
 * Descarta y cuenta elementos inválidos o repetidos; si ninguno sirve, falla.
 */
export function mapCoinGeckoListing(body: unknown): Result<MarketListing, MarketDataError> {
  const envelope = z.array(z.unknown()).safeParse(body)
  if (!envelope.success) return err(INVALID_RESPONSE)

  const quotes: MarketQuote[] = []
  const seen = new Set<string>()
  let skipped = 0

  for (const raw of envelope.data) {
    const identity = CoinGeckoItemIdentitySchema.safeParse(raw)
    const assetId = identity.success ? makeAssetId('crypto', identity.data.id) : undefined

    if (!assetId?.ok || seen.has(assetId.value)) {
      skipped += 1
      continue
    }

    seen.add(assetId.value)

    const mapped = mapItem(raw, assetId.value)

    if (mapped.ok) {
      quotes.push(mapped.value)
    } else {
      skipped += 1
    }
  }

  if (quotes.length === 0) return err(INVALID_RESPONSE)

  return ok({ quotes, skipped })
}
