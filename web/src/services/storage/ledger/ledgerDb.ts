import { openDB } from 'idb'

import { err, ok } from '@/domain/shared/result'

import type { DBSchema, IDBPDatabase } from 'idb'
import type { LedgerRepositoryError } from '@/application/ledger/ports'
import type { Result } from '@/domain/shared/result'

export const LEDGER_DB_NAME = 'omega-markets'
export const LEDGER_DB_VERSION = 1
export const ENTRIES_STORE = 'entries'
export const ID_INDEX = 'byId'

interface LedgerDbSchema extends DBSchema {
  entries: {
    /** Clave autoincremental: el orden de inserción ES el orden del libro. */
    key: number
    /** Registro ya codificado (ver ledgerEntrySchema). Se valida al leer. */
    value: unknown
    indexes: { byId: string }
  }
}

export type LedgerDb = IDBPDatabase<LedgerDbSchema>

/**
 * Abre (o crea) la base. `onInvalidated` se llama cuando esta conexión deja de servir
 * (otra pestaña actualiza la base, o el navegador la cierra): quien la guardó debe soltarla.
 */
export async function openLedgerDb(
  name: string,
  onInvalidated: () => void,
): Promise<Result<LedgerDb, LedgerRepositoryError>> {
  if (typeof indexedDB === 'undefined') return err({ kind: 'UNAVAILABLE' })

  let opened: LedgerDb | undefined

  try {
    opened = await openDB<LedgerDbSchema>(name, LEDGER_DB_VERSION, {
      // Migraciones: un bloque por versión, en orden. Para la versión 2 se añadiría
      // `if (oldVersion < 2) { ... }` SIN tocar el bloque de la 1.
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const store = db.createObjectStore(ENTRIES_STORE, { autoIncrement: true })

          // Índice único: aunque fallara una comprobación nuestra, la base misma impide
          // dos asientos con el mismo id.
          store.createIndex(ID_INDEX, 'id', { unique: true })
        }
      },
      // Otra pestaña quiere actualizar la base: cerramos para no bloquearla.
      blocking() {
        opened?.close()
        onInvalidated()
      },
      terminated: onInvalidated,
    })

    return ok(opened)
  } catch (cause) {
    if (isNamed(cause, 'VersionError')) return err(await readFoundVersion(name))

    return err({ kind: 'UNAVAILABLE', cause })
  }
}

/** La base es de una versión MÁS NUEVA que la que esta app entiende. Averigua cuál. */
async function readFoundVersion(name: string): Promise<LedgerRepositoryError> {
  try {
    const probe = await openDB(name) // sin versión: abre la que haya, sin migrar nada

    const found = probe.version

    probe.close()

    return { kind: 'UNSUPPORTED_VERSION', found }
  } catch (cause) {
    return { kind: 'UNAVAILABLE', cause }
  }
}

export function isNamed(cause: unknown, name: string): boolean {
  return typeof cause === 'object' && cause !== null && 'name' in cause && cause.name === name
}
