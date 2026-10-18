import { MAX_LEDGER_ENTRIES } from '@/application/ledger/ports'
import { EMPTY_LEDGER } from '@/domain/ledger/ledger'
import { err, ok } from '@/domain/shared/result'
import { planAppend } from '@/services/storage/ledger/planAppend'

import type { LedgerRepository, LedgerSnapshot } from '@/application/ledger/ports'
import type { LedgerEntry } from '@/domain/ledger/entries'

export interface MemoryLedgerOptions {
  readonly maxEntries?: number
}

/**
 * Libro en memoria: se pierde al cerrar la pestaña (`persistent: false`).
 * Sirve de respaldo cuando IndexedDB no está disponible, y de referencia del comportamiento
 * que cualquier otro repositorio debe cumplir (ver el contrato en los tests).
 */
export function createMemoryLedgerRepository({
  maxEntries = MAX_LEDGER_ENTRIES,
}: MemoryLedgerOptions = {}): LedgerRepository {
  let entries: readonly LedgerEntry[] = []
  let state = EMPTY_LEDGER

  // `entries` nunca se modifica: cada asiento crea un arreglo nuevo. Quien recibió un
  // snapshot antes no ve cambios después.
  const snapshot = (): LedgerSnapshot => ({ entries, state })

  return {
    persistent: false,

    async load() {
      return ok(snapshot())
    },

    // Entre leer el estado y guardar el asiento no hay ningún `await`: JavaScript no puede
    // intercalar otra operación en medio, así que dos `append` seguidos nunca se pisan.
    async append(decide) {
      const plan = planAppend(snapshot(), decide, maxEntries)

      if (!plan.ok) return err(plan.error)

      entries = [...entries, plan.value.entry]
      state = plan.value.state

      return ok(snapshot())
    },

    async reset() {
      entries = []
      state = EMPTY_LEDGER

      return ok(undefined)
    },
  }
}
