import { describe, expect, it } from 'vitest'

import { toMarketDataError } from '@/services/api/toMarketDataError'

import type { MarketDataError } from '@/application/market/errors'
import type { HttpError } from '@/services/api/httpError'

const cases: Array<[HttpError, MarketDataError]> = [
  [{ kind: 'NETWORK_ERROR' }, { kind: 'NETWORK_ERROR' }],
  [{ kind: 'TIMEOUT' }, { kind: 'TIMEOUT' }],
  [{ kind: 'RATE_LIMIT' }, { kind: 'RATE_LIMIT' }],
  [
    { kind: 'RATE_LIMIT', retryAfterMs: 5_000 },
    { kind: 'RATE_LIMIT', retryAfterMs: 5_000 },
  ],
  [{ kind: 'SERVER_ERROR', status: 503 }, { kind: 'PROVIDER_UNAVAILABLE' }],
  [{ kind: 'CLIENT_ERROR', status: 401 }, { kind: 'PROVIDER_UNAVAILABLE' }],
  [{ kind: 'INVALID_BODY' }, { kind: 'INVALID_RESPONSE' }],
]

describe('toMarketDataError', () => {
  it.each(cases)('%j → %j', (input, expected) => {
    expect(toMarketDataError(input)).toEqual(expected)
  })
})
