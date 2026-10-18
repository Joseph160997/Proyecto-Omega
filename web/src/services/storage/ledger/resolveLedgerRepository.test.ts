import 'fake-indexeddb/auto'

import { deleteDB, openDB } from 'idb'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createIndexedDbLedgerRepository } from '@/services/storage/ledger/indexedDbLedgerRepository'
import { ENTRIES_STORE } from '@/services/storage/ledger/ledgerDb'
import { resolveLedgerRepository } from '@/services/storage/ledger/resolveLedgerRepository'

interface Closable {
  close(): void
}

const databaseNames = new Set<string>()
const repositories: Array<{ close?: () => Promise<void> }> = []
const rawDatabases = new Set<Closable>()
let nextDatabaseId = 0

function freshName(): string {
  const name = `omega-ledger-resolver-test-${Date.now()}-${nextDatabaseId++}`

  databaseNames.add(name)

  return name
}

function trackRawDatabase<T extends Closable>(database: T): T {
  rawDatabases.add(database)

  return database
}

function trackRepository<T extends { close?: () => Promise<void> }>(repository: T): T {
  repositories.push(repository)

  return repository
}

afterEach(async () => {
  vi.unstubAllGlobals()

  for (const repository of repositories) {
    if (typeof repository.close === 'function') await repository.close()
  }
  repositories.length = 0

  rawDatabases.forEach((database) => database.close())
  rawDatabases.clear()

  await Promise.all([...databaseNames].map((name) => deleteDB(name)))
  databaseNames.clear()
})

describe('resolveLedgerRepository', () => {
  it('selects IndexedDB when it is available and opens successfully', async () => {
    const resolved = await resolveLedgerRepository({ dbName: freshName() })

    trackRepository(resolved.repository)
    expect(resolved.repository.persistent).toBe(true)
    expect(resolved.degraded).toBeUndefined()

    const loaded = await resolved.repository.load()

    expect(loaded.ok).toBe(true)
    if (loaded.ok) expect(loaded.value.entries).toEqual([])
  })

  it('uses the memory repository when IndexedDB is absent', async () => {
    vi.stubGlobal('indexedDB', undefined)

    const resolved = await resolveLedgerRepository({ dbName: freshName() })

    expect(resolved.repository.persistent).toBe(false)
    expect(resolved.degraded).toEqual({ reason: 'NO_INDEXEDDB' })
  })

  it('uses memory and reports UNAVAILABLE when opening IndexedDB throws SecurityError', async () => {
    vi.stubGlobal('indexedDB', {
      open() {
        throw new DOMException('Access denied', 'SecurityError')
      },
    })

    const resolved = await resolveLedgerRepository({ dbName: freshName() })

    expect(resolved.repository.persistent).toBe(false)
    expect(resolved.degraded).toEqual({ reason: 'UNAVAILABLE' })
  })

  it('falls back for a newer database without changing its version', async () => {
    const name = freshName()
    const futureDb = trackRawDatabase(await openDB(name, 5))

    const resolved = await resolveLedgerRepository({ dbName: name })

    trackRepository(resolved.repository)
    expect(resolved.repository.persistent).toBe(false)
    expect(resolved.degraded).toEqual({ reason: 'UNSUPPORTED_VERSION' })
    expect(futureDb.version).toBe(5)

    const probe = trackRawDatabase(await openDB(name))

    expect(probe.version).toBe(5)
  })

  it('keeps the IndexedDB repository selected when its data is corrupt', async () => {
    const name = freshName()
    const setup = createIndexedDbLedgerRepository({ dbName: name })

    await setup.ready()
    await setup.close()

    const db = trackRawDatabase(await openDB(name))

    await db.add(ENTRIES_STORE, { untrusted: 'corrupt record' })
    db.close()
    rawDatabases.delete(db)

    const resolved = await resolveLedgerRepository({ dbName: name })

    trackRepository(resolved.repository)
    expect(resolved.repository.persistent).toBe(true)
    expect(resolved.degraded).toBeUndefined()

    const loaded = await resolved.repository.load()

    expect(loaded).toMatchObject({
      ok: false,
      error: { kind: 'CORRUPT_DATA', index: 0 },
    })
  })
})
