import { describe, expect, it } from 'vitest'

import { answersExactly } from '@/application/market/quotes-result'
import { err, ok } from '@/domain/shared/result'
import { createCoinGeckoProvider } from '@/services/api/providers/coingecko/coingeckoProvider'
import { COINGECKO_MARKETS_FIXTURE } from '@/services/api/providers/coingecko/coingeckoMarkets.fixture'

import type { Result } from '@/domain/shared/result'
import type { HttpClient, HttpRequest } from '@/services/api/httpClient'
import type { HttpError } from '@/services/api/httpError'

/** Fake HTTP client: responds with the requested payload and records each request. */
function fakeHttp(response: Result<unknown, HttpError>) {
  const requests: HttpRequest[] = []

  const http: HttpClient = {
    async getJson(request) {
      requests.push(request)
      return response
    },
  }

  return { http, requests }
}

const THREE_COINS = ['crypto:bitcoin', 'crypto:ethereum', 'crypto:solana']

describe('createCoinGeckoProvider', () => {
  it('requests CoinGecko ids only once for the requested assets', async () => {
    const { http, requests } = fakeHttp(ok(COINGECKO_MARKETS_FIXTURE))
    const provider = createCoinGeckoProvider({ http })

    await provider.getQuotes(['crypto:bitcoin', 'crypto:ethereum'])

    expect(requests).toHaveLength(1)

    const url = new URL(requests[0]?.url ?? '')

    expect(url.origin + url.pathname).toBe('https://api.coingecko.com/api/v3/coins/markets')
    expect(url.searchParams.get('vs_currency')).toBe('usd')
    expect(url.searchParams.get('ids')).toBe('bitcoin,ethereum')
  })

  it('does not request a 7-day series for quotes', async () => {
    const { http, requests } = fakeHttp(ok([]))
    const provider = createCoinGeckoProvider({ http })

    await provider.getQuotes(['crypto:bitcoin'])

    expect(new URL(requests[0]?.url ?? '').searchParams.get('sparkline')).toBe('false')
  })

  it('returns quotes from a real response and satisfies the contract', async () => {
    const { http } = fakeHttp(ok(COINGECKO_MARKETS_FIXTURE))
    const provider = createCoinGeckoProvider({ http })

    const result = await provider.getQuotes(THREE_COINS)

    expect(result.quotes).toHaveLength(3)
    expect(result.failures).toEqual([])
    expect(answersExactly(result, THREE_COINS)).toBe(true)
  })

  it('respects a custom baseUrl, with or without a trailing slash', async () => {
    const { http, requests } = fakeHttp(ok([]))
    const provider = createCoinGeckoProvider({ http, baseUrl: 'https://proxy.test/cg/' })

    await provider.getQuotes(['crypto:bitcoin'])

    expect(requests[0]?.url.startsWith('https://proxy.test/cg/coins/markets?')).toBe(true)
  })

  it('lists top assets with the requested limit and cancellation signal', async () => {
    const { http, requests } = fakeHttp(ok(COINGECKO_MARKETS_FIXTURE))
    const provider = createCoinGeckoProvider({ http })
    const controller = new AbortController()

    const result = await provider.listTop(250, { signal: controller.signal })
    const url = new URL(requests[0]?.url ?? '')

    expect(requests).toHaveLength(1)
    expect(url.searchParams.get('vs_currency')).toBe('usd')
    expect(url.searchParams.get('order')).toBe('market_cap_desc')
    expect(url.searchParams.get('per_page')).toBe('250')
    expect(url.searchParams.get('page')).toBe('1')
    expect(url.searchParams.has('ids')).toBe(false)
    expect(requests[0]?.signal).toBe(controller.signal)
    expect(result.ok && result.value.quotes[0]?.assetId).toBe('crypto:bitcoin')
  })

  it('requests the 7-day series for listings', async () => {
    const { http, requests } = fakeHttp(ok(COINGECKO_MARKETS_FIXTURE))
    const provider = createCoinGeckoProvider({ http })

    await provider.listTop(250)

    expect(new URL(requests[0]?.url ?? '').searchParams.get('sparkline')).toBe('true')
  })

  it('rejects a listing limit above CoinGecko maximum before requesting', async () => {
    const { http, requests } = fakeHttp(ok([]))
    const provider = createCoinGeckoProvider({ http })

    await expect(provider.listTop(251)).rejects.toThrow(RangeError)
    expect(requests).toHaveLength(0)
  })

  it('returns all listed coins with canonical asset IDs', async () => {
    const { http } = fakeHttp(ok(COINGECKO_MARKETS_FIXTURE))
    const provider = createCoinGeckoProvider({ http })

    const result = await provider.listTop(3)

    expect(result.ok && result.value.quotes.map((quote) => quote.assetId)).toEqual(THREE_COINS)
    expect(result.ok && result.value.skipped).toBe(0)
  })

  it.each([[0], [-1], [1.5], [251], [Number.NaN]])('rejects listing limit %s', async (limit) => {
    const { http, requests } = fakeHttp(ok([]))
    const provider = createCoinGeckoProvider({ http })

    await expect(provider.listTop(limit)).rejects.toThrow(RangeError)
    expect(requests).toHaveLength(0)
  })

  it('returns HTTP errors instead of throwing for a listing request', async () => {
    const { http } = fakeHttp(err({ kind: 'RATE_LIMIT', retryAfterMs: 10_000 }))
    const provider = createCoinGeckoProvider({ http })

    expect(await provider.listTop(250)).toEqual({
      ok: false,
      error: { kind: 'RATE_LIMIT', retryAfterMs: 10_000 },
    })
  })

  it('returns INVALID_RESPONSE for an unexpected listing body', async () => {
    const { http } = fakeHttp(ok({ status: { error_code: 429 } }))
    const provider = createCoinGeckoProvider({ http })

    expect(await provider.listTop(250)).toEqual({
      ok: false,
      error: { kind: 'INVALID_RESPONSE' },
    })
  })

  it('rejects a cancelled listing request with AbortError', async () => {
    const http: HttpClient = {
      getJson: () => Promise.reject(new DOMException('aborted', 'AbortError')),
    }
    const provider = createCoinGeckoProvider({ http })

    await expect(provider.listTop(250)).rejects.toMatchObject({ name: 'AbortError' })
  })

  describe('unsupported assets', () => {
    it.each([
      ['stock:aapl'],
      ['crypto:Bitcoin'],
      ['bitcoin'],
      ['crypto:'],
      ['constructor'],
      ['__proto__'],
    ])('%s is UNSUPPORTED_ASSET and does not spend a request', async (assetId) => {
      const { http, requests } = fakeHttp(ok([]))
      const provider = createCoinGeckoProvider({ http })

      const result = await provider.getQuotes([assetId])

      expect(requests).toHaveLength(0)
      expect(result.failures).toEqual([{ assetId, error: { kind: 'UNSUPPORTED_ASSET', assetId } }])
    })

    it('queries well-formed crypto IDs that CoinGecko does not know', async () => {
      const { http, requests } = fakeHttp(ok(COINGECKO_MARKETS_FIXTURE))
      const provider = createCoinGeckoProvider({ http })
      const ids = ['crypto:bitcoin', 'crypto:noexiste']

      const result = await provider.getQuotes(ids)

      expect(requests).toHaveLength(1)
      expect(result.quotes.map((quote) => quote.assetId)).toEqual(['crypto:bitcoin'])
      expect(result.failures).toEqual([
        {
          assetId: 'crypto:noexiste',
          error: { kind: 'UNSUPPORTED_ASSET', assetId: 'crypto:noexiste' },
        },
      ])
      expect(answersExactly(result, ids)).toBe(true)
    })

    it('with a mixed list, only requested supported ids are queried', async () => {
      const { http, requests } = fakeHttp(ok(COINGECKO_MARKETS_FIXTURE))
      const provider = createCoinGeckoProvider({ http })
      const ids = ['crypto:bitcoin', 'stock:aapl']

      const result = await provider.getQuotes(ids)

      expect(new URL(requests[0]?.url ?? '').searchParams.get('ids')).toBe('bitcoin')
      expect(result.quotes.map((quote) => quote.assetId)).toEqual(['crypto:bitcoin'])
      expect(result.failures).toEqual([
        { assetId: 'stock:aapl', error: { kind: 'UNSUPPORTED_ASSET', assetId: 'stock:aapl' } },
      ])
      expect(answersExactly(result, ids)).toBe(true)
    })

    it('an empty request does not call anyone', async () => {
      const { http, requests } = fakeHttp(ok([]))
      const provider = createCoinGeckoProvider({ http })

      expect(await provider.getQuotes([])).toEqual({ quotes: [], failures: [] })
      expect(requests).toHaveLength(0)
    })
  })

  describe('HTTP failures', () => {
    it('a 429 marks all requested assets as RATE_LIMIT', async () => {
      const { http } = fakeHttp(err({ kind: 'RATE_LIMIT', retryAfterMs: 30_000 }))
      const provider = createCoinGeckoProvider({ http })
      const ids = ['crypto:bitcoin', 'crypto:ethereum']

      const result = await provider.getQuotes(ids)

      expect(result.quotes).toEqual([])
      expect(result.failures).toEqual([
        { assetId: 'crypto:bitcoin', error: { kind: 'RATE_LIMIT', retryAfterMs: 30_000 } },
        { assetId: 'crypto:ethereum', error: { kind: 'RATE_LIMIT', retryAfterMs: 30_000 } },
      ])
      expect(answersExactly(result, ids)).toBe(true)
    })

    it('a 503 is translated to PROVIDER_UNAVAILABLE', async () => {
      const { http } = fakeHttp(err({ kind: 'SERVER_ERROR', status: 503 }))
      const provider = createCoinGeckoProvider({ http })

      const result = await provider.getQuotes(['crypto:bitcoin'])

      expect(result.failures[0]?.error).toEqual({ kind: 'PROVIDER_UNAVAILABLE' })
    })

    it('unsupported assets keep their error even when the request fails', async () => {
      const { http } = fakeHttp(err({ kind: 'TIMEOUT' }))
      const provider = createCoinGeckoProvider({ http })
      const ids = ['crypto:bitcoin', 'stock:aapl']

      const result = await provider.getQuotes(ids)

      expect(result.failures.map((f) => [f.assetId, f.error.kind])).toEqual([
        ['crypto:bitcoin', 'TIMEOUT'],
        ['stock:aapl', 'UNSUPPORTED_ASSET'],
      ])
      expect(answersExactly(result, ids)).toBe(true)
    })
  })

  describe('cancellation', () => {
    it('passes the signal through to the HTTP client', async () => {
      const { http, requests } = fakeHttp(ok([]))
      const provider = createCoinGeckoProvider({ http })
      const controller = new AbortController()

      await provider.getQuotes(['crypto:bitcoin'], { signal: controller.signal })

      expect(requests[0]?.signal).toBe(controller.signal)
    })

    it('if the request is cancelled, the promise rejects instead of returning a data failure', async () => {
      const http: HttpClient = {
        getJson: () => Promise.reject(new DOMException('aborted', 'AbortError')),
      }
      const provider = createCoinGeckoProvider({ http })

      await expect(provider.getQuotes(['crypto:bitcoin'])).rejects.toMatchObject({
        name: 'AbortError',
      })
    })
  })
})
