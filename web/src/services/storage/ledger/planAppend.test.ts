import { describe, expect, it, vi } from 'vitest'

import { EMPTY_LEDGER } from '@/domain/ledger/ledger'
import { err, ok } from '@/domain/shared/result'
import { planAppend } from '@/services/storage/ledger/planAppend'
import { BTC, buy, deposit } from '@/test-utils/makeEntries'

import type { DecideEntry, LedgerSnapshot } from '@/application/ledger/ports'

const empty: LedgerSnapshot = { entries: [], state: EMPTY_LEDGER }

describe('planAppend', () => {
  it('returns the valid entry and resulting state', () => {
    const plan = planAppend(empty, () => ok(deposit('d1', '100')))

    expect(plan.ok && plan.value.entry.id).toBe('d1')
    expect(plan.ok && plan.value.state.cash.toString()).toBe('100.00')
  })

  it('does not mutate the input snapshot', () => {
    planAppend(empty, () => ok(deposit('d1', '100')))

    expect(empty.entries).toEqual([])
    expect(empty.state.cash.toString()).toBe('0.00')
  })

  it('checks the entry limit BEFORE calling the decision function', () => {
    const decide = vi.fn<DecideEntry>(() => ok(deposit('d2', '1')))
    const full: LedgerSnapshot = { entries: [deposit('d1', '1')], state: EMPTY_LEDGER }

    expect(planAppend(full, decide, 1)).toEqual({
      ok: false,
      error: { kind: 'LEDGER_FULL', max: 1 },
    })
    expect(decide).not.toHaveBeenCalled()
  })

  it('prioritizes a decision rejection over subsequent checks', () => {
    const plan = planAppend(empty, () => err({ kind: 'INVALID_QUANTITY' }))

    expect(!plan.ok && plan.error.kind).toBe('REJECTED')
  })

  it('detects duplicate ids before checking for insufficient cash', () => {
    const first = planAppend(empty, () => ok(deposit('x', '10')))
    const snapshot: LedgerSnapshot = first.ok
      ? { entries: [first.value.entry], state: first.value.state }
      : empty

    const plan = planAppend(snapshot, () => ok(buy('x', BTC, '1', '50000')))

    expect(!plan.ok && plan.error.kind === 'LEDGER_ERROR' && plan.error.error.kind).toBe(
      'DUPLICATE_ENTRY_ID',
    )
  })

  it('checks ledger rules before validating the serialized record', () => {
    // An impossible timestamp and insufficient cash are both present; the ledger error wins.
    const bad = { ...buy('b1', BTC, '1', '50000'), createdAt: 5 }

    const plan = planAppend(empty, () => ok(bad))

    expect(!plan.ok && plan.error.kind).toBe('LEDGER_ERROR')
  })
})
