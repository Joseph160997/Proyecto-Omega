import { MarketListingUnavailableError } from '@/features/markets/marketQueries'
import { formatWait } from '@/lib/format'

import type { MarketDataError } from '@/application/market/errors'

export function describeMarketDataError(error: MarketDataError): string {
  switch (error.kind) {
    case 'NETWORK_ERROR':
      return 'No hay conexión con el proveedor de datos. Revisa tu internet.'
    case 'TIMEOUT':
      return 'El proveedor tardó demasiado en responder.'
    case 'RATE_LIMIT':
      return error.retryAfterMs === undefined
        ? 'Se alcanzó el límite de consultas gratuitas. Espera un momento y vuelve a intentarlo.'
        : `Se alcanzó el límite de consultas gratuitas. Vuelve a intentarlo en ${formatWait(error.retryAfterMs)}.`
    case 'PROVIDER_UNAVAILABLE':
      return 'El proveedor de datos no está disponible en este momento.'
    case 'INVALID_RESPONSE':
      return 'El proveedor envió datos que no pudimos interpretar.'
    case 'UNSUPPORTED_ASSET':
      return 'Este activo no está disponible en el proveedor.'
    default: {
      const _exhaustive: never = error
      return _exhaustive
    }
  }
}

export function describeMarketError(error: unknown): string {
  if (error instanceof MarketListingUnavailableError) {
    return describeMarketDataError(error.reason)
  }

  return 'Ocurrió un error inesperado al cargar los datos.'
}
