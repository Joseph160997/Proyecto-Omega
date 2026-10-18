import { describe, expect, it } from 'vitest'

import { deriveDataStatus, describeDataStatus } from '@/features/markets/marketDataStatus'
import { DEFAULT_MAX_QUOTE_AGE_MS } from '@/domain/market/quote'

import type { DataStatus, DataStatusInput } from '@/features/markets/marketDataStatus'

const NOW = 1_700_000_000_000
const MIN = 60_000

const derive = (overrides: Partial<DataStatusInput>): DataStatus =>
  deriveDataStatus({
    isFetching: false,
    isError: false,
    newestTimestamp: undefined,
    now: NOW,
    ...overrides,
  })

describe('deriveDataStatus', () => {
  it('without data or a request, there is nothing to show', () => {
    expect(derive({})).toEqual({ kind: 'idle' })
  })

  it('without data while fetching, the status is loading', () => {
    expect(derive({ isFetching: true })).toEqual({ kind: 'loading' })
  })

  it('without data and with an error, the status is failed with no age', () => {
    expect(derive({ isError: true })).toEqual({ kind: 'failed', ageMs: undefined })
  })

  it('without data while retrying after an error, the status is loading', () => {
    expect(derive({ isError: true, isFetching: true })).toEqual({ kind: 'loading' })
  })

  it('recent data is fresh and includes its age', () => {
    expect(derive({ newestTimestamp: NOW - 3 * MIN })).toEqual({ kind: 'fresh', ageMs: 3 * MIN })
  })

  it('the exact threshold is fresh; one millisecond later it is stale', () => {
    expect(derive({ newestTimestamp: NOW - DEFAULT_MAX_QUOTE_AGE_MS })).toEqual({
      kind: 'fresh',
      ageMs: DEFAULT_MAX_QUOTE_AGE_MS,
    })
    expect(derive({ newestTimestamp: NOW - DEFAULT_MAX_QUOTE_AGE_MS - 1 })).toEqual({
      kind: 'stale',
      ageMs: DEFAULT_MAX_QUOTE_AGE_MS + 1,
    })
  })

  it('data being refreshed reports refreshing with its age', () => {
    expect(derive({ newestTimestamp: NOW - 2 * MIN, isFetching: true })).toEqual({
      kind: 'refreshing',
      ageMs: 2 * MIN,
    })
  })

  it('a failed refresh reports failure and preserves the data age', () => {
    expect(derive({ newestTimestamp: NOW - 8 * MIN, isError: true })).toEqual({
      kind: 'failed',
      ageMs: 8 * MIN,
    })
  })

  it('data being retried after an error reports refreshing', () => {
    expect(derive({ newestTimestamp: NOW - 8 * MIN, isError: true, isFetching: true }).kind).toBe(
      'refreshing',
    )
  })

  it('a future timestamp (clock skew) has an age of zero', () => {
    expect(derive({ newestTimestamp: NOW + 5 * MIN })).toEqual({ kind: 'fresh', ageMs: 0 })
  })
})

describe('describeDataStatus', () => {
  it.each<[DataStatus, { tone: string; label: string } | null]>([
    [{ kind: 'idle' }, null],
    [{ kind: 'loading' }, { tone: 'busy', label: 'Cargando datos…' }],
    [
      { kind: 'refreshing', ageMs: 2 * MIN },
      { tone: 'busy', label: 'Actualizando…' },
    ],
    [
      { kind: 'fresh', ageMs: 3 * MIN },
      { tone: 'ok', label: 'Datos de hace 3 min' },
    ],
    [
      { kind: 'fresh', ageMs: 10_000 },
      { tone: 'ok', label: 'Datos de hace menos de 1 min' },
    ],
    [
      { kind: 'stale', ageMs: 14 * MIN },
      { tone: 'warn', label: 'Datos de hace 14 min' },
    ],
    [
      { kind: 'failed', ageMs: 8 * MIN },
      { tone: 'warn', label: 'Datos de hace 8 min · sin actualizar' },
    ],
    [
      { kind: 'failed', ageMs: undefined },
      { tone: 'warn', label: 'Sin conexión con los datos de mercado' },
    ],
  ])('%j', (status, expected) => {
    expect(describeDataStatus(status)).toEqual(expected)
  })
})
