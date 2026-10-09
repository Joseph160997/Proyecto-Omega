import { err, ok } from '@/domain/shared/result'
import { parseRetryAfter } from '@/services/api/retryAfter'

import type { Result } from '@/domain/shared/result'
import type { HttpError } from '@/services/api/httpError'

export const DEFAULT_TIMEOUT_MS = 8_000

export interface HttpRequest {
  readonly url: string
  readonly headers?: Readonly<Record<string, string>>
  /** Cancelación externa (TanStack Query). Cancelar RECHAZA con AbortError. */
  readonly signal?: AbortSignal
  readonly timeoutMs?: number
}

export interface HttpClient {
  getJson(request: HttpRequest): Promise<Result<unknown, HttpError>>
}

export interface HttpClientDeps {
  readonly fetchFn?: typeof fetch
  readonly now?: () => number
}

function abortError(): DOMException {
  return new DOMException('The operation was aborted.', 'AbortError')
}

function classifyStatus(response: Response, nowMs: number): HttpError {
  if (response.status === 429) {
    const retryAfterMs = parseRetryAfter(response.headers.get('Retry-After'), nowMs)

    return retryAfterMs === undefined
      ? { kind: 'RATE_LIMIT' }
      : { kind: 'RATE_LIMIT', retryAfterMs }
  }

  return response.status >= 500
    ? { kind: 'SERVER_ERROR', status: response.status }
    : { kind: 'CLIENT_ERROR', status: response.status }
}

export function createHttpClient({
  // Flecha, no `globalThis.fetch` suelto: guardar fetch como propiedad de un
  // objeto y llamarlo desde ahí lanza "Illegal invocation" en navegadores.
  fetchFn = (input: RequestInfo | URL, init?: RequestInit) => globalThis.fetch(input, init),
  now = Date.now,
}: HttpClientDeps = {}): HttpClient {
  return {
    async getJson({ url, headers, signal, timeoutMs = DEFAULT_TIMEOUT_MS }) {
      if (signal?.aborted) throw abortError()

      const controller = new AbortController()
      let timedOut = false

      const onExternalAbort = () => controller.abort()
      signal?.addEventListener('abort', onExternalAbort, { once: true })

      const timer = setTimeout(() => {
        timedOut = true
        controller.abort()
      }, timeoutMs)

      try {
        const response = await fetchFn(url, {
          method: 'GET',
          headers,
          signal: controller.signal,
        })

        if (!response.ok) return err(classifyStatus(response, now()))

        // El timeout también cubre la lectura del cuerpo, no solo las cabeceras.
        const body: unknown = await response.json()

        return ok(body)
      } catch (cause) {
        // El orden importa: fetch rechaza con AbortError tanto por cancelación
        // externa como por nuestro timeout, hay que distinguir quién abortó.
        if (signal?.aborted) throw abortError()
        if (timedOut) return err({ kind: 'TIMEOUT' })
        if (cause instanceof SyntaxError) return err({ kind: 'INVALID_BODY' })

        return err({ kind: 'NETWORK_ERROR' })
      } finally {
        clearTimeout(timer)
        signal?.removeEventListener('abort', onExternalAbort)
      }
    },
  }
}
