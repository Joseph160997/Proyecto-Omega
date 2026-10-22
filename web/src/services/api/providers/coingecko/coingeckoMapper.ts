import { z } from 'zod'

import { failAll } from '@/application/market/quotes-result'
import { createCandle } from '@/domain/market/candle'
import { makeAssetId } from '@/domain/market/asset'
import { Price } from '@/domain/shared/price'
import { err, ok } from '@/domain/shared/result'
import {
  CoinGeckoItemIdentitySchema,
  CoinGeckoMarketItemSchema,
  CoinGeckoOhlcSchema,
} from '@/services/api/providers/coingecko/coingeckoSchema'

import type { MarketDataError } from '@/application/market/errors'
import type { MarketListing, QuoteFailure, QuotesResult } from '@/application/market/quotes-result'
import type { Candle } from '@/domain/market/candle'
import type { MarketQuote } from '@/domain/market/quote'
import type { Result } from '@/domain/shared/result'

const INVALID_RESPONSE: MarketDataError = { kind: 'INVALID_RESPONSE' }

/** Only HTTPS logos are accepted because this external value is used as an image source. */
function safeHttpsUrl(value: string | null | undefined): string | undefined {
  if (value === undefined || value === null) return undefined

  try {
    const url = new URL(value)

    return url.protocol === 'https:' ? url.href : undefined
  } catch {
    return undefined
  }
}

function mapItem(raw: unknown, assetId: string): Result<MarketQuote, MarketDataError> {
  const parsed = CoinGeckoMarketItemSchema.safeParse(raw)
  if (!parsed.success) return err(INVALID_RESPONSE)

  const item = parsed.data
  if (item.current_price === null) return err(INVALID_RESPONSE)

  const price = Price.fromMarket(item.current_price)
  if (!price.ok) return err(INVALID_RESPONSE)

  const timestamp = Date.parse(item.last_updated)
  if (Number.isNaN(timestamp)) return err(INVALID_RESPONSE)

  const prices = item.sparkline_in_7d?.price

  return ok({
    assetId,
    price: price.value,
    timestamp,
    source: 'coingecko',
    symbol: item.symbol.toUpperCase(),
    name: item.name,
    type: 'crypto',
    imageUrl: safeHttpsUrl(item.image),
    change24hPercent: item.price_change_percentage_24h ?? undefined,
    volume24h: item.total_volume ?? undefined,
    sparkline7d: prices !== undefined && prices.length > 0 ? prices : undefined,
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

export function mapCoinGeckoOhlc(body: unknown): Result<readonly Candle[], MarketDataError> {
  const parsed = CoinGeckoOhlcSchema.safeParse(body)
  if (!parsed.success) return err(INVALID_RESPONSE)

  const candles: Candle[] = []

  for (const [time, open, high, low, close] of parsed.data) {
    const values = [open, high, low, close].map((value) => Price.fromMarket(value))
    if (values.some((value) => !value.ok)) return err(INVALID_RESPONSE)

    const [openPrice, highPrice, lowPrice, closePrice] = values
    if (!openPrice?.ok || !highPrice?.ok || !lowPrice?.ok || !closePrice?.ok) {
      return err(INVALID_RESPONSE)
    }

    const candle = createCandle({
      time,
      open: openPrice.value,
      high: highPrice.value,
      low: lowPrice.value,
      close: closePrice.value,
    })
    if (!candle.ok) return err(INVALID_RESPONSE)

    candles.push(candle.value)
  }

  candles.sort((left, right) => left.time - right.time)

  for (let index = 1; index < candles.length; index += 1) {
    if (candles[index]?.time === candles[index - 1]?.time) return err(INVALID_RESPONSE)
  }

  return ok(candles)
}
