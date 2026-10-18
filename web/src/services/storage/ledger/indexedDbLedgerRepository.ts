import { MAX_LEDGER_ENTRIES } from '@/application/ledger/ports'
import { replayLedger } from '@/domain/ledger/ledger'
import { err, ok } from '@/domain/shared/result'
import { decodeEntry, encodeEntry } from '@/services/storage/ledger/ledgerEntrySchema'
import {
  ENTRIES_STORE,
  isNamed,
  LEDGER_DB_NAME,
  openLedgerDb,
} from '@/services/storage/ledger/ledgerDb'
import { planAppend } from '@/services/storage/ledger/planAppend'

import type {
  LedgerRepository,
  LedgerRepositoryError,
  LedgerSnapshot,
} from '@/application/ledger/ports'
import type { LedgerEntry } from '@/domain/ledger/entries'
import type { Result } from '@/domain/shared/result'
import type { LedgerDb } from '@/services/storage/ledger/ledgerDb'

export interface IndexedDbLedgerOptions {
  readonly dbName?: string
  readonly maxEntries?: number
}

export interface IndexedDbLedgerRepository extends LedgerRepository {
  /** Abre la base sin leer el libro. Sirve para saber si IndexedDB funciona. */
  ready(): Promise<Result<void, LedgerRepositoryError>>
  close(): Promise<void>
}

/** Un fallo DENTRO de una transacción (la base ya estaba abierta). */
export function toTransactionError(cause: unknown): LedgerRepositoryError {
  return isNamed(cause, 'QuotaExceededError')
    ? { kind: 'QUOTA_EXCEEDED' }
    : { kind: 'TRANSACTION_FAILED' }
}

/** Registros del disco → libro. Nada se acepta sin validar y reconstruir. */
function toSnapshot(records: readonly unknown[]): Result<LedgerSnapshot, LedgerRepositoryError> {
  const entries: LedgerEntry[] = []

  for (const [index, raw] of records.entries()) {
    const decoded = decodeEntry(raw)

    if (!decoded.ok) return err({ kind: 'CORRUPT_DATA', index, issues: decoded.error.issues })

    entries.push(decoded.value)
  }

  const replayed = replayLedger(entries)

  // Registros válidos uno a uno, pero que juntos violan las reglas del libro (efectivo
  // negativo, ids repetidos...): para el usuario es igual de "datos dañados".
  if (!replayed.ok) {
    return err({
      kind: 'CORRUPT_DATA',
      index: replayed.error.index,
      issues: [`ledger: ${replayed.error.error.kind}`],
    })
  }

  return ok({ entries, state: replayed.value })
}

export function createIndexedDbLedgerRepository({
  dbName = LEDGER_DB_NAME,
  maxEntries = MAX_LEDGER_ENTRIES,
}: IndexedDbLedgerOptions = {}): IndexedDbLedgerRepository {
  let current: Promise<Result<LedgerDb, LedgerRepositoryError>> | undefined

  /** Una sola conexión compartida; si se invalida o falla, la próxima operación reintenta. */
  function connect() {
    if (current === undefined) {
      const attempt = openLedgerDb(dbName, () => {
        if (current === attempt) current = undefined
      })

      current = attempt

      void attempt.then((result) => {
        if (!result.ok && current === attempt) current = undefined
      })
    }

    return current
  }

  async function withDb<T>(
    work: (db: LedgerDb) => Promise<Result<T, LedgerRepositoryError>>,
  ): Promise<Result<T, LedgerRepositoryError>> {
    const opened = await connect()

    if (!opened.ok) return opened

    try {
      return await work(opened.value)
    } catch (cause) {
      // La conexión se cerró entre abrirla y usarla: suéltala para reabrir la próxima vez.
      if (isNamed(cause, 'InvalidStateError')) current = undefined

      return err(toTransactionError(cause))
    }
  }

  return {
    persistent: true,

    async ready() {
      const opened = await connect()

      return opened.ok ? ok(undefined) : opened
    },

    async close() {
      const connection = current

      current = undefined

      const opened = await connection

      if (opened?.ok) opened.value.close()
    },

    load: () =>
      withDb(async (db) => {
        const tx = db.transaction(ENTRIES_STORE, 'readonly')
        const [records] = await Promise.all([tx.store.getAll(), tx.done])

        return toSnapshot(records)
      }),

    // Leer, decidir y escribir ocurren dentro de UNA transacción de lectura/escritura.
    // IndexedDB no deja que otra transacción de escritura sobre el mismo almacén corra a la
    // vez (ni desde otra pestaña): la segunda espera a que la primera termine y entonces lee
    // el estado ya actualizado. Por eso dos pestañas no pueden gastar el mismo dinero.
    //
    // OJO: dentro de esta función solo se puede esperar (`await`) a operaciones de IndexedDB.
    // Si se espera a otra cosa (un fetch, un setTimeout), la transacción se cierra sola.
    append: (decide) =>
      withDb(async (db) => {
        const tx = db.transaction(ENTRIES_STORE, 'readwrite')

        const finish = async <T>(result: T): Promise<T> => {
          await tx.done // sin escribir nada, se cierra sin cambios

          return result
        }

        const book = toSnapshot(await tx.store.getAll())

        if (!book.ok) return finish(book)

        const plan = planAppend(book.value, decide, maxEntries)

        if (!plan.ok) return finish(err(plan.error))

        await Promise.all([tx.store.add(encodeEntry(plan.value.entry)), tx.done])

        return ok({
          entries: [...book.value.entries, plan.value.entry],
          state: plan.value.state,
        })
      }),

    reset: () =>
      withDb(async (db) => {
        const tx = db.transaction(ENTRIES_STORE, 'readwrite')

        await Promise.all([tx.store.clear(), tx.done])

        return ok(undefined)
      }),
  }
}
