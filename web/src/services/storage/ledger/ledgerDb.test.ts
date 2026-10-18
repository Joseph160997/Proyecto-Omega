import 'fake-indexeddb/auto'

import { deleteDB, openDB } from 'idb'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ENTRIES_STORE, ID_INDEX, isNamed, LEDGER_DB_VERSION, openLedgerDb } from './ledgerDb'

const databaseNames = new Set<string>()
const connections: Array<{ close: () => void }> = []
let nextDatabaseId = 0

function freshDatabaseName(): string {
  const name = `omega-ledger-db-test-${Date.now()}-${nextDatabaseId++}`

  databaseNames.add(name)

  return name
}

function trackConnection<T extends { close: () => void }>(connection: T): T {
  connections.push(connection)

  return connection
}

afterEach(async () => {
  vi.unstubAllGlobals()
  connections.splice(0).forEach((connection) => connection.close())
  await Promise.all([...databaseNames].map((name) => deleteDB(name)))
  databaseNames.clear()
})

describe('openLedgerDb', () => {
  it('creates the versioned entries store with an auto-increment key and unique id index', async () => {
    const name = freshDatabaseName()
    const result = await openLedgerDb(name, vi.fn())

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const db = trackConnection(result.value)

    expect(db.version).toBe(LEDGER_DB_VERSION)
    const tx = db.transaction(ENTRIES_STORE, 'readonly')
    expect(tx.store.autoIncrement).toBe(true)
    expect(tx.store.index(ID_INDEX).unique).toBe(true)
    await tx.done
  })

  it('reopens an existing database without recreating its store or index', async () => {
    const name = freshDatabaseName()
    const first = await openLedgerDb(name, vi.fn())

    expect(first.ok).toBe(true)
    if (!first.ok) return
    first.value.close()

    const second = await openLedgerDb(name, vi.fn())

    expect(second.ok).toBe(true)
    if (!second.ok) return

    const db = trackConnection(second.value)
    const tx = db.transaction(ENTRIES_STORE, 'readonly')

    expect(db.version).toBe(LEDGER_DB_VERSION)
    expect(tx.store.indexNames).toContain(ID_INDEX)
    await tx.done
  })

  it('enforces unique entry ids at the database index', async () => {
    const result = await openLedgerDb(freshDatabaseName(), vi.fn())

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const db = trackConnection(result.value)
    const record = { id: 'same-id', kind: 'deposit' }

    await db.add(ENTRIES_STORE, record)
    await expect(db.add(ENTRIES_STORE, record)).rejects.toMatchObject({ name: 'ConstraintError' })
    await expect(db.count(ENTRIES_STORE)).resolves.toBe(1)
  })

  it('reports the actual version of a newer database without changing it', async () => {
    const name = freshDatabaseName()
    const newerDb = trackConnection(await openDB(name, 3))

    const result = await openLedgerDb(name, vi.fn())

    expect(result).toEqual({ ok: false, error: { kind: 'UNSUPPORTED_VERSION', found: 3 } })
    expect(newerDb.version).toBe(3)
  })

  it('closes its connection and notifies the owner when a newer version is requested', async () => {
    const name = freshDatabaseName()
    const onInvalidated = vi.fn()
    const opened = await openLedgerDb(name, onInvalidated)

    expect(opened.ok).toBe(true)
    if (!opened.ok) return
    trackConnection(opened.value)

    const newerDb = trackConnection(
      await openDB(name, 2, {
        upgrade(db) {
          db.createObjectStore('metadata')
        },
      }),
    )

    expect(newerDb.version).toBe(2)
    expect(onInvalidated).toHaveBeenCalledTimes(1)
  })

  it('returns UNAVAILABLE instead of throwing when IndexedDB is missing', async () => {
    vi.stubGlobal('indexedDB', undefined)

    await expect(openLedgerDb(freshDatabaseName(), vi.fn())).resolves.toEqual({
      ok: false,
      error: { kind: 'UNAVAILABLE' },
    })
  })
})

describe('isNamed', () => {
  it('matches named errors and safely rejects unrelated values', () => {
    expect(isNamed(new DOMException('blocked', 'SecurityError'), 'SecurityError')).toBe(true)
    expect(isNamed(new Error('other'), 'SecurityError')).toBe(false)
    expect(isNamed({ name: 'QuotaExceededError' }, 'QuotaExceededError')).toBe(true)
    expect(isNamed(null, 'SecurityError')).toBe(false)
    expect(isNamed('SecurityError', 'SecurityError')).toBe(false)
  })
})
