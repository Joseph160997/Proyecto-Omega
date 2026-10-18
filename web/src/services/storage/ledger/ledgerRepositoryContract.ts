import { describe, expect, it, vi } from 'vitest'

import { err, ok } from '@/domain/shared/result'
import { BTC, buy, deposit, sell } from '@/test-utils/makeEntries'

import type { DecideEntry, LedgerRepository } from '@/application/ledger/ports'
import type { LedgerEntry } from '@/domain/ledger/entries'

export interface ContractOptions {
  readonly maxEntries?: number
}

export type RepositoryFactory = (
  options: ContractOptions,
) => LedgerRepository | Promise<LedgerRepository>

const add =
  (entry: LedgerEntry): DecideEntry =>
  () =>
    ok(entry)

/**
 * The contract every LedgerRepository must satisfy. This is not a test for one implementation;
 * it is the executable definition of what it means to be a ledger repository.
 * Each implementation imports it and runs it with its own factory.
 */
export function ledgerRepositoryContract(name: string, create: RepositoryFactory) {
  describe(`LedgerRepository contract: ${name}`, () => {
    it('starts with an empty ledger', async () => {
      const repo = await create({})
      const result = await repo.load()

      expect(result.ok && result.value.entries).toEqual([])
      expect(result.ok && result.value.state.cash.toString()).toBe('0.00')
    })

    it('append stores the entry and returns the updated ledger', async () => {
      const repo = await create({})

      const result = await repo.append(add(deposit('d1', '10000')))

      expect(result.ok && result.value.entries.map((entry) => entry.id)).toEqual(['d1'])
      expect(result.ok && result.value.state.cash.toString()).toBe('10000.00')
    })

    it('load restores stored entries in the same order', async () => {
      const repo = await create({})

      await repo.append(add(deposit('d1', '10000')))
      await repo.append(add(buy('b1', BTC, '0.1', '50000')))
      await repo.append(add(sell('s1', BTC, '0.05', '55000')))

      const loaded = await repo.load()

      expect(loaded.ok && loaded.value.entries.map((entry) => entry.id)).toEqual(['d1', 'b1', 's1'])
      expect(loaded.ok && loaded.value.state.cash.toString()).toBe('7742.25')
      expect(loaded.ok && loaded.value.state.realizedPnl.toString()).toBe('244.75')
    })

    it('passes the CURRENT state, including previous entries, to decide', async () => {
      const repo = await create({})
      const seen: string[] = []

      await repo.append(add(deposit('d1', '500')))
      await repo.append((state) => {
        seen.push(state.cash.toString())

        return ok(deposit('d2', '100'))
      })

      expect(seen).toEqual(['500.00'])
    })

    describe('rejected appends leave the ledger unchanged', () => {
      const expectUnchanged = async (repo: LedgerRepository) => {
        const loaded = await repo.load()

        expect(loaded.ok && loaded.value.entries.map((entry) => entry.id)).toEqual(['d1'])
        expect(loaded.ok && loaded.value.state.cash.toString()).toBe('100.00')
      }

      const withDeposit = async () => {
        const repo = await create({})

        await repo.append(add(deposit('d1', '100')))

        return repo
      }

      it('maps a rejected decision to REJECTED with its reason', async () => {
        const repo = await withDeposit()

        const result = await repo.append(() => err({ kind: 'STALE_QUOTE', ageMs: 5, maxAgeMs: 1 }))

        expect(result).toEqual({
          ok: false,
          error: { kind: 'REJECTED', rejection: { kind: 'STALE_QUOTE', ageMs: 5, maxAgeMs: 1 } },
        })
        await expectUnchanged(repo)
      })

      it('maps insufficient cash to LEDGER_ERROR', async () => {
        const repo = await withDeposit()

        const result = await repo.append(add(buy('b1', BTC, '0.1', '50000')))

        expect(!result.ok && result.error.kind).toBe('LEDGER_ERROR')
        expect(!result.ok && result.error.kind === 'LEDGER_ERROR' && result.error.error.kind).toBe(
          'INSUFFICIENT_CASH',
        )
        await expectUnchanged(repo)
      })

      it('maps selling an unheld asset to LEDGER_ERROR', async () => {
        const repo = await withDeposit()

        const result = await repo.append(add(sell('s1', BTC, '1', '50000')))

        expect(!result.ok && result.error.kind === 'LEDGER_ERROR' && result.error.error.kind).toBe(
          'INSUFFICIENT_POSITION',
        )
        await expectUnchanged(repo)
      })

      it('maps a duplicate id to LEDGER_ERROR', async () => {
        const repo = await withDeposit()

        const result = await repo.append(add(deposit('d1', '5')))

        expect(!result.ok && result.error.kind === 'LEDGER_ERROR' && result.error.error.kind).toBe(
          'DUPLICATE_ENTRY_ID',
        )
        await expectUnchanged(repo)
      })

      it.each([
        ['impossible timestamp', { ...deposit('d2', '5'), createdAt: 5 }],
        ['id with invalid characters', deposit('d 2;', '5')],
        ['malformed asset id', buy('b1', 'Crypto:BTC', '0.001', '1')],
      ])('maps an entry that cannot be read back (%s) to INVALID_ENTRY', async (_label, entry) => {
        const repo = await withDeposit()

        const result = await repo.append(add(entry))

        expect(!result.ok && result.error.kind).toBe('INVALID_ENTRY')
        await expectUnchanged(repo)
      })
    })

    it('accepts only one of two concurrent purchases that exceed the available cash together', async () => {
      const repo = await create({})

      await repo.append(add(deposit('d1', '6000')))

      // Each purchase costs 5,005.00: either fits alone, but not both together.
      const [first, second] = await Promise.all([
        repo.append(add(buy('b1', BTC, '0.1', '50000'))),
        repo.append(add(buy('b2', BTC, '0.1', '50000'))),
      ])

      expect([first.ok, second.ok].filter(Boolean)).toHaveLength(1)

      const loaded = await repo.load()

      expect(loaded.ok && loaded.value.entries).toHaveLength(2)
      expect(loaded.ok && loaded.value.state.cash.isNegative()).toBe(false)
    })

    it('rejects a full ledger without calling decide', async () => {
      const repo = await create({ maxEntries: 2 })
      const decide = vi.fn<DecideEntry>(() => ok(deposit('d3', '1')))

      await repo.append(add(deposit('d1', '1')))
      await repo.append(add(deposit('d2', '1')))

      const result = await repo.append(decide)

      expect(result).toEqual({ ok: false, error: { kind: 'LEDGER_FULL', max: 2 } })
      expect(decide).not.toHaveBeenCalled()
    })

    it('reset empties the ledger and allows ids to be reused', async () => {
      const repo = await create({})

      await repo.append(add(deposit('d1', '100')))

      const reset = await repo.reset()
      const loaded = await repo.load()

      expect(reset.ok).toBe(true)
      expect(loaded.ok && loaded.value.entries).toEqual([])
      expect((await repo.append(add(deposit('d1', '100')))).ok).toBe(true)
    })

    it('does not mutate a previously returned snapshot when the ledger changes', async () => {
      const repo = await create({})
      const before = await repo.append(add(deposit('d1', '100')))

      await repo.append(add(deposit('d2', '50')))

      expect(before.ok && before.value.entries).toHaveLength(1)
      expect(before.ok && before.value.state.cash.toString()).toBe('100.00')
    })
  })
}
