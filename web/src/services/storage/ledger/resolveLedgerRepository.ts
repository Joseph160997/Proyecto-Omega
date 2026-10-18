import { createIndexedDbLedgerRepository } from '@/services/storage/ledger/indexedDbLedgerRepository'
import { createMemoryLedgerRepository } from '@/services/storage/ledger/memoryLedgerRepository'

import type { LedgerRepository } from '@/application/ledger/ports'
import type { IndexedDbLedgerOptions } from '@/services/storage/ledger/indexedDbLedgerRepository'

export type DegradedReason = 'NO_INDEXEDDB' | 'UNAVAILABLE' | 'UNSUPPORTED_VERSION'

export interface ResolvedLedger {
  readonly repository: LedgerRepository
  /** Presente cuando se usa la memoria: el motivo, para avisar al usuario de que NO se guarda. */
  readonly degraded?: { readonly reason: DegradedReason }
}

/**
 * Elige dónde vive el libro al arrancar.
 *
 * Solo cae a memoria cuando no hay NINGÚN dato que perder (IndexedDB no existe o no se puede
 * abrir) o cuando los datos son de una versión más nueva que esta app (no se tocan).
 * Con datos DAÑADOS no cambia a memoria: parecería que el dinero desapareció. El error sale
 * al cargar, y la interfaz debe ofrecer exportar o reiniciar.
 */
export async function resolveLedgerRepository(
  options: IndexedDbLedgerOptions = {},
): Promise<ResolvedLedger> {
  const memory = (reason: DegradedReason): ResolvedLedger => ({
    repository: createMemoryLedgerRepository({ maxEntries: options.maxEntries }),
    degraded: { reason },
  })

  if (typeof indexedDB === 'undefined') return memory('NO_INDEXEDDB')

  const repository = createIndexedDbLedgerRepository(options)
  const ready = await repository.ready()

  if (ready.ok) return { repository }

  return memory(ready.error.kind === 'UNSUPPORTED_VERSION' ? 'UNSUPPORTED_VERSION' : 'UNAVAILABLE')
}
