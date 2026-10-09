import type { MarketDataError } from '@/application/market/errors'
import type { HttpError } from '@/services/api/httpError'

/**
 * Traduce errores HTTP a errores del puerto de mercado.
 *
 * La traducción pierde información a propósito: cualquier 4xx (key inválida,
 * 404, etc.) y cualquier 5xx significan "este provider no sirve ahora" para el
 * fallback. Un provider que distinga casos (ej. 404 → UNSUPPORTED_ASSET) debe
 * mirar el HttpError ANTES de llamar a esta función.
 */
export function toMarketDataError(error: HttpError): MarketDataError {
  switch (error.kind) {
    case 'NETWORK_ERROR':
      return { kind: 'NETWORK_ERROR' }
    case 'TIMEOUT':
      return { kind: 'TIMEOUT' }
    case 'RATE_LIMIT':
      return { kind: 'RATE_LIMIT', retryAfterMs: error.retryAfterMs }
    case 'SERVER_ERROR':
    case 'CLIENT_ERROR':
      return { kind: 'PROVIDER_UNAVAILABLE' }
    case 'INVALID_BODY':
      return { kind: 'INVALID_RESPONSE' }
    default: {
      const _exhaustive: never = error
      return _exhaustive
    }
  }
}
