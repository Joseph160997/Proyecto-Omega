import { describe, expect, it } from 'vitest'

import { ok } from '@/domain/shared/result'
import { ledgerRepositoryContract } from '@/services/storage/ledger/ledgerRepositoryContract'
import { createMemoryLedgerRepository } from '@/services/storage/ledger/memoryLedgerRepository'
import { deposit } from '@/test-utils/makeEntries'

ledgerRepositoryContract('memory', (options) => createMemoryLedgerRepository(options))

describe('memoryLedgerRepository', () => {
  it('reports that it is not persistent', () => {
    expect(createMemoryLedgerRepository().persistent).toBe(false)
  })

  it('keeps each repository instance independent', async () => {
    const one = createMemoryLedgerRepository()
    const two = createMemoryLedgerRepository()

    await one.append(() => ok(deposit('d1', '100')))

    const loaded = await two.load()

    expect(loaded.ok && loaded.value.entries).toEqual([])
  })
})
