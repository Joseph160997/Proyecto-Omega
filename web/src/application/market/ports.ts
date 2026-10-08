import type { MarketDataError } from '@/application/market/errors'
import type { MarketListing, QuotesResult } from '@/application/market/quotes-result'
import type { Result } from '@/domain/shared/result'

export interface MarketDataRequestOptions {
  /** TanStack Query pasa una señal para cancelar peticiones obsoletas. */
  readonly signal?: AbortSignal
}

export interface MarketDataProvider {
  /**
   * Contrato:
   * - Los fallos esperados (red, timeout, límite, datos inválidos) NO lanzan:
   *   se devuelven en `failures`.
   * - Cada id pedido aparece exactamente una vez, en `quotes` o en `failures`.
   * - Si la petición se cancela con `signal`, la promesa rechaza con AbortError
   *   (cancelar no es un fallo de datos).
   * - Cualquier otra excepción indica un bug del provider.
   */
  getQuotes(assetIds: readonly string[], options?: MarketDataRequestOptions): Promise<QuotesResult>
}

export interface MarketListingProvider {
  /**
   * Los `limit` activos más grandes por capitalización, en el orden del proveedor.
   *
   * Contrato:
   * - Un fallo esperado se devuelve como error, no se lanza.
   * - `limit` debe ser un entero positivo; cada provider impone su máximo y lanza
   *   RangeError si se excede (es un bug de quien llama, no un fallo de datos).
   * - Cancelar con `signal` rechaza con AbortError.
   * - El orden no es parte del contrato de la UI: quien necesite un orden lo pide explícito.
   */
  listTop(
    limit: number,
    options?: MarketDataRequestOptions,
  ): Promise<Result<MarketListing, MarketDataError>>
}
