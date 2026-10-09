import { describe, expect, it } from 'vitest'

import type { MarketDataError } from '@/application/market/errors'
import { describeMarketDataError, describeMarketError } from '@/features/markets/marketErrors'
import { MarketListingUnavailableError } from '@/features/markets/marketQueries'

const kinds: MarketDataError[] = [
  { kind: 'NETWORK_ERROR' },
  { kind: 'TIMEOUT' },
  { kind: 'RATE_LIMIT' },
  { kind: 'PROVIDER_UNAVAILABLE' },
  { kind: 'INVALID_RESPONSE' },
  { kind: 'UNSUPPORTED_ASSET', assetId: 'crypto:x' },
]

describe('describeMarketDataError', () => {
  it.each(kinds)('%j produces a readable message', (error) => {
    const message = describeMarketDataError(error)

    expect(message.length).toBeGreaterThan(10)
    expect(message.endsWith('.')).toBe(true)
  })

  it('returns a distinct message for each error kind', () => {
    const messages = kinds.map((error) => describeMarketDataError(error))

    expect(new Set(messages).size).toBe(kinds.length)
  })

  it('includes a retry delay when one is provided', () => {
    expect(describeMarketDataError({ kind: 'RATE_LIMIT', retryAfterMs: 30_000 })).toContain(
      '30 segundos',
    )
  })

  it('does not invent a delay when none is provided', () => {
    const message = describeMarketDataError({ kind: 'RATE_LIMIT' })

    expect(message).toContain('Espera un momento')
    expect(message).not.toMatch(/\d/)
  })
})

describe('describeMarketError', () => {
  it('translates a listing error using its cause', () => {
    const reason: MarketDataError = { kind: 'TIMEOUT' }

    expect(describeMarketError(new MarketListingUnavailableError(reason))).toBe(
      describeMarketDataError(reason),
    )
  })

  it.each([[new Error('boom')], ['text'], [null], [undefined], [42]])(
    'returns a generic message for unexpected errors (%j)',
    (error) => {
      expect(describeMarketError(error)).toContain('inesperado')
    },
  )
})
