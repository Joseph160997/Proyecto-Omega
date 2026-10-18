import { MAX_LEDGER_ENTRIES } from '@/application/ledger/ports'
import { applyEntry } from '@/domain/ledger/ledger'
import { err, ok } from '@/domain/shared/result'
import { decodeEntry, encodeEntry } from '@/services/storage/ledger/ledgerEntrySchema'

import type { DecideEntry, LedgerRepositoryError, LedgerSnapshot } from '@/application/ledger/ports'
import type { LedgerEntry } from '@/domain/ledger/entries'
import type { LedgerState } from '@/domain/ledger/ledger'
import type { Result } from '@/domain/shared/result'

export interface AppendPlan {
  readonly entry: LedgerEntry
  /** El estado del libro DESPUÉS de añadir el asiento. */
  readonly state: LedgerState
}

/**
 * Todas las comprobaciones de un `append`, en un solo sitio y sin tocar disco.
 * Lo comparten el repositorio en memoria y el de IndexedDB: así ambos rechazan exactamente
 * lo mismo, y las reglas no se copian ni se desvían.
 *
 * Orden (de lo más barato a lo más caro):
 *   1. tope de asientos   2. `decide`   3. id repetido
 *   4. reglas del libro   5. que el asiento se pueda leer de vuelta
 */
export function planAppend(
  current: LedgerSnapshot,
  decide: DecideEntry,
  maxEntries: number = MAX_LEDGER_ENTRIES,
): Result<AppendPlan, LedgerRepositoryError> {
  if (current.entries.length >= maxEntries) {
    return err({ kind: 'LEDGER_FULL', max: maxEntries })
  }

  const decision = decide(current.state)

  if (!decision.ok) return err({ kind: 'REJECTED', rejection: decision.error })

  const entry = decision.value

  if (current.entries.some((existing) => existing.id === entry.id)) {
    return err({ kind: 'LEDGER_ERROR', error: { kind: 'DUPLICATE_ENTRY_ID', entryId: entry.id } })
  }

  const applied = applyEntry(current.state, entry)

  if (!applied.ok) return err({ kind: 'LEDGER_ERROR', error: applied.error })

  // Si no pasaría el esquema al leerlo, guardarlo dejaría un libro que no se puede abrir.
  const readBack = decodeEntry(encodeEntry(entry))

  if (!readBack.ok) return err({ kind: 'INVALID_ENTRY', issues: readBack.error.issues })

  return ok({ entry, state: applied.value })
}
