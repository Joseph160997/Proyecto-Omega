import type { LedgerEntry } from '@/domain/ledger/entries'
import type { LedgerError, LedgerState } from '@/domain/ledger/ledger'
import type { OrderRejection } from '@/domain/orders/rejection'
import type { Result } from '@/domain/shared/result'

/** Tope de asientos: protege al navegador de un libro que crece sin límite. */
export const MAX_LEDGER_ENTRIES = 50_000

export type LedgerRepositoryError =
  | { kind: 'UNAVAILABLE'; cause?: unknown }
  | { kind: 'QUOTA_EXCEEDED' }
  | { kind: 'UNSUPPORTED_VERSION'; found: number }
  | { kind: 'CORRUPT_DATA'; index: number | undefined; issues: readonly string[] }
  | { kind: 'TRANSACTION_FAILED' }
  /** `decide` no quiso crear un asiento (p. ej. saldo insuficiente). */
  | { kind: 'REJECTED'; rejection: OrderRejection }
  /** El asiento viola las reglas del libro (id repetido, efectivo, posición...). */
  | { kind: 'LEDGER_ERROR'; error: LedgerError }
  /** El asiento no se puede guardar en forma segura (no pasaría el esquema al leerlo). */
  | { kind: 'INVALID_ENTRY'; issues: readonly string[] }
  | { kind: 'LEDGER_FULL'; max: number }

/** Todo el libro: los asientos (la verdad) y el estado derivado de ellos. */
export interface LedgerSnapshot {
  readonly entries: readonly LedgerEntry[]
  readonly state: LedgerState
}

/** Recibe el estado ACTUAL y decide qué asiento añadir, o por qué no. */
export type DecideEntry = (state: LedgerState) => Result<LedgerEntry, OrderRejection>

export interface LedgerRepository {
  /** false = los datos se pierden al cerrar la pestaña (modo de respaldo en memoria). */
  readonly persistent: boolean
  load(): Promise<Result<LedgerSnapshot, LedgerRepositoryError>>
  /**
   * Lee el estado, ejecuta `decide` y guarda el asiento como UNA operación indivisible.
   * Así dos pestañas no pueden gastar el mismo dinero.
   */
  append(decide: DecideEntry): Promise<Result<LedgerSnapshot, LedgerRepositoryError>>
  reset(): Promise<Result<void, LedgerRepositoryError>>
}
