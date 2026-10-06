import { afterEach, describe, expect, it, vi } from 'vitest'

import { createHttpClient, DEFAULT_TIMEOUT_MS } from '@/services/api/httpClient'

const URL_UNDER_TEST = 'https://api.test/quotes'

type Handler = (init: RequestInit | undefined) => Promise<Response>

/** fetch falso: el handler decide qué ocurre. Nada toca la red. */
function fakeFetch(handler: Handler): typeof fetch {
  return ((_input: RequestInfo | URL, init?: RequestInit) => handler(init)) as typeof fetch
}

/** Una petición que nunca termina, pero que respeta la señal de aborto. */
const hangingFetch = fakeFetch(
  (init) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        reject(new DOMException('aborted', 'AbortError'))
      })
    }),
)

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), init)

afterEach(() => {
  vi.useRealTimers()
})

describe('createHttpClient.getJson', () => {
  it('devuelve el JSON de una respuesta correcta', async () => {
    const client = createHttpClient({ fetchFn: fakeFetch(async () => jsonResponse({ price: 1 })) })

    expect(await client.getJson({ url: URL_UNDER_TEST })).toEqual({
      ok: true,
      value: { price: 1 },
    })
  })

  it('hace GET con las cabeceras pedidas y una señal propia', async () => {
    let captured: RequestInit | undefined
    const client = createHttpClient({
      fetchFn: fakeFetch(async (init) => {
        captured = init
        return jsonResponse({})
      }),
    })

    await client.getJson({ url: URL_UNDER_TEST, headers: { 'x-token': 'abc' } })

    expect(captured?.method).toBe('GET')
    expect(captured?.headers).toEqual({ 'x-token': 'abc' })
    expect(captured?.signal).toBeInstanceOf(AbortSignal)
  })

  describe('errores HTTP', () => {
    it('429 con Retry-After informa la espera', async () => {
      const client = createHttpClient({
        fetchFn: fakeFetch(
          async () => new Response(null, { status: 429, headers: { 'Retry-After': '30' } }),
        ),
      })

      expect(await client.getJson({ url: URL_UNDER_TEST })).toEqual({
        ok: false,
        error: { kind: 'RATE_LIMIT', retryAfterMs: 30_000 },
      })
    })

    it('429 sin Retry-After no inventa una espera', async () => {
      const client = createHttpClient({
        fetchFn: fakeFetch(async () => new Response(null, { status: 429 })),
      })

      expect(await client.getJson({ url: URL_UNDER_TEST })).toEqual({
        ok: false,
        error: { kind: 'RATE_LIMIT' },
      })
    })

    it.each([[500], [503]])('%s es SERVER_ERROR', async (status) => {
      const client = createHttpClient({
        fetchFn: fakeFetch(async () => new Response(null, { status })),
      })

      expect(await client.getJson({ url: URL_UNDER_TEST })).toEqual({
        ok: false,
        error: { kind: 'SERVER_ERROR', status },
      })
    })

    it.each([[400], [401], [404]])('%s es CLIENT_ERROR', async (status) => {
      const client = createHttpClient({
        fetchFn: fakeFetch(async () => new Response(null, { status })),
      })

      expect(await client.getJson({ url: URL_UNDER_TEST })).toEqual({
        ok: false,
        error: { kind: 'CLIENT_ERROR', status },
      })
    })

    it('un 200 con cuerpo que no es JSON es INVALID_BODY', async () => {
      const client = createHttpClient({
        fetchFn: fakeFetch(async () => new Response('<html>mantenimiento</html>', { status: 200 })),
      })

      expect(await client.getJson({ url: URL_UNDER_TEST })).toEqual({
        ok: false,
        error: { kind: 'INVALID_BODY' },
      })
    })

    it('un fallo de red es NETWORK_ERROR', async () => {
      const client = createHttpClient({
        fetchFn: fakeFetch(async () => {
          throw new TypeError('Failed to fetch')
        }),
      })

      expect(await client.getJson({ url: URL_UNDER_TEST })).toEqual({
        ok: false,
        error: { kind: 'NETWORK_ERROR' },
      })
    })
  })

  describe('timeout', () => {
    it('devuelve TIMEOUT cuando se agota el tiempo pedido', async () => {
      vi.useFakeTimers()
      const client = createHttpClient({ fetchFn: hangingFetch })

      const pending = client.getJson({ url: URL_UNDER_TEST, timeoutMs: 1_000 })
      await vi.advanceTimersByTimeAsync(1_000)

      expect(await pending).toEqual({ ok: false, error: { kind: 'TIMEOUT' } })
    })

    it('por defecto espera 8 segundos', async () => {
      vi.useFakeTimers()
      const client = createHttpClient({ fetchFn: hangingFetch })

      const pending = client.getJson({ url: URL_UNDER_TEST })
      await vi.advanceTimersByTimeAsync(DEFAULT_TIMEOUT_MS)

      expect(await pending).toEqual({ ok: false, error: { kind: 'TIMEOUT' } })
    })

    it('no deja timers colgados tras una respuesta correcta', async () => {
      vi.useFakeTimers()
      const client = createHttpClient({ fetchFn: fakeFetch(async () => jsonResponse({})) })

      await client.getJson({ url: URL_UNDER_TEST })

      expect(vi.getTimerCount()).toBe(0)
    })
  })

  describe('cancelación externa', () => {
    it('cancelar a mitad de camino RECHAZA con AbortError (no devuelve Result)', async () => {
      const client = createHttpClient({ fetchFn: hangingFetch })
      const controller = new AbortController()

      const pending = client.getJson({ url: URL_UNDER_TEST, signal: controller.signal })
      controller.abort()

      const error = await pending.catch((cause: unknown) => cause)

      expect(error).toBeInstanceOf(DOMException)
      expect((error as DOMException).name).toBe('AbortError')
    })

    it('una señal ya cancelada rechaza sin llamar a fetch', async () => {
      let calls = 0
      const client = createHttpClient({
        fetchFn: fakeFetch(async () => {
          calls += 1
          return jsonResponse({})
        }),
      })
      const controller = new AbortController()
      controller.abort()

      const error = await client
        .getJson({ url: URL_UNDER_TEST, signal: controller.signal })
        .catch((cause: unknown) => cause)

      expect((error as DOMException).name).toBe('AbortError')
      expect(calls).toBe(0)
    })
  })
})
