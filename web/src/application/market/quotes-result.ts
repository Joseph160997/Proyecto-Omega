import type { MarketDataError } from '@/application/market/errors'
import type { MarketQuote } from '@/domain/market/quote'

export interface QuoteFailure {
  readonly assetId: string
  readonly error: MarketDataError
}

export interface QuotesResult {
  readonly quotes: readonly MarketQuote[]
  readonly failures: readonly QuoteFailure[]
}

/** Todos los ids fallaron por la misma causa (ej. sin red). */
export function failAll(assetIds: readonly string[], error: MarketDataError): QuotesResult {
  return { quotes: [], failures: assetIds.map((assetId) => ({ assetId, error })) }
}

/** Une resultados de conjuntos DISJUNTOS de ids (ej. un provider por tipo de activo). */
export function mergeQuotesResults(...results: readonly QuotesResult[]): QuotesResult {
  return {
    quotes: results.flatMap((result) => result.quotes),
    failures: results.flatMap((result) => result.failures),
  }
}

/**
 * Comprueba el contrato del puerto: cada id pedido aparece exactamente una vez,
 * ya sea en `quotes` o en `failures`, y no sobra ninguno.
 * `requested` debe venir sin duplicados (quien llama los elimina).
 */
export function answersExactly(result: QuotesResult, requested: readonly string[]): boolean {
  const answered = [
    ...result.quotes.map((quote) => quote.assetId),
    ...result.failures.map((failure) => failure.assetId),
  ].sort()
  const expected = [...requested].sort()

  return answered.length === expected.length && answered.every((id, i) => id === expected[i])
}
