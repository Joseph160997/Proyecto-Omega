import 'fake-indexeddb/auto'

import { deleteDB, openDB } from 'idb'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ok } from '@/domain/shared/result'
import { ledgerRepositoryContract } from '@/services/storage/ledger/ledgerRepositoryContract'
import {
  createIndexedDbLedgerRepository,
  toTransactionError,
} from '@/services/storage/ledger/indexedDbLedgerRepository'
import { ENTRIES_STORE } from '@/services/storage/ledger/ledgerDb'
import { encodeEntry } from '@/services/storage/ledger/ledgerEntrySchema'
import { BTC, buy, deposit } from '@/test-utils/makeEntries'

import type { IndexedDbLedgerRepository } from '@/services/storage/ledger/indexedDbLedgerRepository'

interface Closable {
  close(): void
}

const repositories = new Set<IndexedDbLedgerRepository>()
const rawDatabases = new Set<Closable>()
const databaseNames = new Set<string>()
let nextDatabaseId = 0

function freshName(): string {
  const name = `omega-ledger-repository-test-${Date.now()}-${nextDatabaseId++}`

  databaseNames.add(name)

  return name
}

function createRepository(dbName = freshName(), maxEntries?: number): IndexedDbLedgerRepository {
  const repository = createIndexedDbLedgerRepository({ dbName, maxEntries })

  repositories.add(repository)

  return repository
}

function trackRawDatabase<T extends Closable>(database: T): T {
  rawDatabases.add(database)

  return database
}

async function seedRawRecords(name: string, records: readonly unknown[]): Promise<void> {
  const repository = createRepository(name)
  const ready = await repository.ready()

  if (!ready.ok) throw new Error(`Could not initialize test database: ${ready.error.kind}`)

  await repository.close()

  const db = trackRawDatabase(await openDB(name))
  const tx = db.transaction(ENTRIES_STORE, 'readwrite')
  const writes = records.map((record) => tx.store.add(record))

  await Promise.all([...writes, tx.done])
  db.close()
  rawDatabases.delete(db)
}

async function countStoredRecords(name: string): Promise<number> {
  const db = trackRawDatabase(await openDB(name))
  const count = await db.count(ENTRIES_STORE)

  db.close()
  rawDatabases.delete(db)

  return count
}

afterEach(async () => {
  vi.unstubAllGlobals()

  await Promise.all([...repositories].map((repository) => repository.close()))
  repositories.clear()

  rawDatabases.forEach((database) => database.close())
  rawDatabases.clear()

  await Promise.all([...databaseNames].map((name) => deleteDB(name)))
  databaseNames.clear()
})

ledgerRepositoryContract('indexeddb', (options) =>
  createRepository(freshName(), options.maxEntries),
)

describe('indexedDbLedgerRepository', () => {
  it('persists entries after closing and reopening the repository', async () => {
    const name = freshName()
    const first = createRepository(name)

    await first.append(() => ok(deposit('d1', '10000')))
    await first.append(() => ok(buy('b1', BTC, '0.1', '50000')))
    await first.close()

    const reopened = createRepository(name)
    const loaded = await reopened.load()

    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return

    expect(loaded.value.entries.map((entry) => entry.id)).toEqual(['d1', 'b1'])
    expect(loaded.value.state.cash.toString()).toBe('4995.00')
  })

  it('serializes appends from two repository instances sharing the same database', async () => {
    const name = freshName()
    const first = createRepository(name)
    const second = createRepository(name)

    await Promise.all([first.ready(), second.ready()])
    await first.append(() => ok(deposit('d1', '6000')))

    const [firstBuy, secondBuy] = await Promise.all([
      first.append(() => ok(buy('b1', BTC, '0.1', '50000'))),
      second.append(() => ok(buy('b2', BTC, '0.1', '50000'))),
    ])

    expect([firstBuy.ok, secondBuy.ok].filter(Boolean)).toHaveLength(1)

    const loaded = await first.load()

    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return

    expect(loaded.value.entries).toHaveLength(2)
    expect(loaded.value.state.cash.isNegative()).toBe(false)
  })

  it('detects duplicate ids across repository instances', async () => {
    const name = freshName()
    const first = createRepository(name)
    const second = createRepository(name)

    await first.append(() => ok(deposit('shared-id', '100')))

    const duplicate = await second.append(() => ok(deposit('shared-id', '5')))

    expect(duplicate).toMatchObject({
      ok: false,
      error: { kind: 'LEDGER_ERROR', error: { kind: 'DUPLICATE_ENTRY_ID' } },
    })
  })

  it('returns CORRUPT_DATA with the record index and sanitized issues', async () => {
    const name = freshName()
    const secret = 'SENSITIVE_LEDGER_VALUE_12345'

    await seedRawRecords(name, [
      {
        v: 1,
        kind: 'deposit',
        id: 'd1',
        amount: secret,
        createdAt: 1_700_000_000_000,
        [secret]: secret,
      },
    ])

    const loaded = await createRepository(name).load()

    expect(loaded).toMatchObject({
      ok: false,
      error: { kind: 'CORRUPT_DATA', index: 0 },
    })
    if (!loaded.ok && loaded.error.kind === 'CORRUPT_DATA') {
      expect(loaded.error.issues.join(' ')).not.toContain(secret)
    }
  })

  it('rejects non-canonical decimal values when loading stored records', async () => {
    const name = freshName()

    await seedRawRecords(name, [
      {
        v: 1,
        kind: 'deposit',
        id: 'd1',
        amount: '100',
        createdAt: 1_700_000_000_000,
      },
    ])

    const loaded = await createRepository(name).load()

    expect(loaded).toMatchObject({ ok: false, error: { kind: 'CORRUPT_DATA', index: 0 } })
  })

  it('rejects individually valid entries that violate ledger rules when replayed', async () => {
    const name = freshName()

    await seedRawRecords(name, [encodeEntry(buy('b1', BTC, '0.1', '50000'))])

    const loaded = await createRepository(name).load()

    expect(loaded).toEqual({
      ok: false,
      error: { kind: 'CORRUPT_DATA', index: 0, issues: ['ledger: INSUFFICIENT_CASH'] },
    })
  })

  it('does not append to a corrupted ledger or change its stored records', async () => {
    const name = freshName()

    await seedRawRecords(name, [{ kind: 'untrusted', secret: 'DO_NOT_LEAK' }])

    const repository = createRepository(name)
    const result = await repository.append(() => ok(deposit('d2', '100')))

    expect(result).toMatchObject({
      ok: false,
      error: { kind: 'CORRUPT_DATA', index: 0 },
    })
    expect(await countStoredRecords(name)).toBe(1)
  })

  it('reset clears a corrupted ledger so it can be used again', async () => {
    const name = freshName()

    await seedRawRecords(name, [{ invalid: true }])

    const repository = createRepository(name)

    expect((await repository.load()).ok).toBe(false)
    expect((await repository.reset()).ok).toBe(true)

    const loaded = await repository.load()

    expect(loaded.ok).toBe(true)
    if (loaded.ok) expect(loaded.value.entries).toEqual([])
  })

  it('enforces the unique id index even when data is inserted outside the repository', async () => {
    const name = freshName()
    const repository = createRepository(name)

    await repository.ready()
    const db = trackRawDatabase(await openDB(name))
    const record = encodeEntry(deposit('duplicate-id', '10'))

    await db.add(ENTRIES_STORE, record)
    await expect(db.add(ENTRIES_STORE, record)).rejects.toMatchObject({ name: 'ConstraintError' })
    expect(await db.count(ENTRIES_STORE)).toBe(1)
  })

  it('reports unsupported database versions without changing the database', async () => {
    const name = freshName()
    const futureDb = trackRawDatabase(await openDB(name, 3))
    const repository = createRepository(name)

    await expect(repository.ready()).resolves.toEqual({
      ok: false,
      error: { kind: 'UNSUPPORTED_VERSION', found: 3 },
    })
    expect(futureDb.version).toBe(3)
  })

  it('releases its connection when another connection upgrades the database', async () => {
    const name = freshName()
    const repository = createRepository(name)

    await repository.ready()

    const upgraded = trackRawDatabase(
      await openDB(name, 2, {
        upgrade(db) {
          db.createObjectStore('metadata')
        },
      }),
    )

    expect(upgraded.version).toBe(2)
    await expect(repository.load()).resolves.toMatchObject({
      ok: false,
      error: { kind: 'UNSUPPORTED_VERSION', found: 2 },
    })
  })

  it('returns UNAVAILABLE instead of throwing when IndexedDB is missing', async () => {
    vi.stubGlobal('indexedDB', undefined)
    const repository = createRepository(freshName())

    await expect(repository.ready()).resolves.toEqual({ ok: false, error: { kind: 'UNAVAILABLE' } })
  })
})

describe('toTransactionError', () => {
  it('maps quota errors separately from other transaction failures', () => {
    expect(toTransactionError(new DOMException('quota', 'QuotaExceededError'))).toEqual({
      kind: 'QUOTA_EXCEEDED',
    })
    expect(toTransactionError(new Error('unexpected'))).toEqual({ kind: 'TRANSACTION_FAILED' })
    expect(toTransactionError('unexpected')).toEqual({ kind: 'TRANSACTION_FAILED' })
  })
})
