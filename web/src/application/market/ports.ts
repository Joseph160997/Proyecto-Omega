import type { QuotesResult } from '@/application/market/quotes-result'

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
