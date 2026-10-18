import { describe, expect, it } from 'vitest'

import { depositEntry } from '@/domain/ledger/entries'
import { applyEntry, EMPTY_LEDGER } from '@/domain/ledger/ledger'
import { Money } from '@/domain/shared/money'
import { err, ok } from '@/domain/shared/result'

import { MAX_LEDGER_ENTRIES } from './ports'

import type { DecideEntry, LedgerRepository, LedgerRepositoryError, LedgerSnapshot } from './ports'

describe('ledger repository port', () => {
  it('defines a finite upper bound for ledger entries', () => {
    expect(MAX_LEDGER_ENTRIES).toBe(50_000)
  })

  it('accepts the complete repository error contract', () => {
    const errors: LedgerRepositoryError[] = [
      { kind: 'UNAVAILABLE' },
      { kind: 'UNAVAILABLE', cause: new Error('storage unavailable') },
      { kind: 'QUOTA_EXCEEDED' },
      { kind: 'UNSUPPORTED_VERSION', found: 2 },
      { kind: 'CORRUPT_DATA', index: 0, issues: ['amount: invalid_format'] },
      { kind: 'CORRUPT_DATA', index: undefined, issues: ['version: invalid_value'] },
      { kind: 'TRANSACTION_FAILED' },
      {
        kind: 'REJECTED',
        rejection: {
          kind: 'INSUFFICIENT_CASH',
          required: Money.usd('100.00'),
          available: Money.usd('50.00'),
        },
      },
      { kind: 'LEDGER_ERROR', error: { kind: 'INVALID_DEPOSIT', entryId: 'd1' } },
      { kind: 'INVALID_ENTRY', issues: ['amount: invalid_format'] },
      { kind: 'LEDGER_FULL', max: MAX_LEDGER_ENTRIES },
    ]

    expect(errors).toHaveLength(11)
    expect(errors.map((error) => error.kind)).toEqual([
      'UNAVAILABLE',
      'UNAVAILABLE',
      'QUOTA_EXCEEDED',
      'UNSUPPORTED_VERSION',
      'CORRUPT_DATA',
      'CORRUPT_DATA',
      'TRANSACTION_FAILED',
      'REJECTED',
      'LEDGER_ERROR',
      'INVALID_ENTRY',
      'LEDGER_FULL',
    ])
  })

  it('models a snapshot as source entries plus derived state', () => {
    const entry = depositEntry('d1', Money.usd('100.00'), 1_700_000_000_000)
    const applied = applyEntry(EMPTY_LEDGER, entry)

    if (!applied.ok) throw new Error('The test deposit could not be applied')

    const snapshot: LedgerSnapshot = {
      entries: [entry],
      state: applied.value,
    }

    expect(snapshot.entries).toHaveLength(1)
    expect(snapshot.entries[0]?.kind).toBe('deposit')
    expect(snapshot.state.cash.toString()).toBe('100.00')
  })

  it('allows a decision function to return either an entry or an order rejection', () => {
    const decide: DecideEntry = (state) => {
      if (state.cash.isLessThan(Money.usd('25.00'))) {
        return err({
          kind: 'INSUFFICIENT_CASH',
          required: Money.usd('25.00'),
          available: state.cash,
        })
      }

      return ok(depositEntry('d1', Money.usd('25.00'), 1_700_000_000_000))
    }

    const accepted = decide({ ...EMPTY_LEDGER, cash: Money.usd('50.00') })
    const rejected = decide(EMPTY_LEDGER)

    expect(accepted.ok).toBe(true)
    expect(rejected).toMatchObject({
      ok: false,
      error: { kind: 'INSUFFICIENT_CASH' },
    })
  })

  it('requires asynchronous load, append, and reset operations', async () => {
    const snapshot: LedgerSnapshot = { entries: [], state: EMPTY_LEDGER }
    const repository: LedgerRepository = {
      persistent: false,
      load: async () => ok(snapshot),
      append: async () => ok(snapshot),
      reset: async () => ok(undefined),
    }

    expect(repository.persistent).toBe(false)
    await expect(repository.load()).resolves.toEqual(ok(snapshot))
    await expect(
      repository.append(() => ok(depositEntry('d1', Money.usd('1'), 1_700_000_000_000))),
    ).resolves.toEqual(ok(snapshot))
    await expect(repository.reset()).resolves.toEqual(ok(undefined))
  })
})
