import 'fake-indexeddb/auto'

import { deleteDB } from 'idb'
import { afterEach, describe, expect, it } from 'vitest'

import { createOpenAccount, createResetAccount, INITIAL_CASH } from '@/application/ledger/account'
import { createPlaceOrder } from '@/application/ledger/placeOrder'
import { DEFAULT_TRADING_POLICY } from '@/application/ledger/policy'
import { Price } from '@/domain/shared/price'
import { Quantity } from '@/domain/shared/quantity'
import { createIndexedDbLedgerRepository } from '@/services/storage/ledger/indexedDbLedgerRepository'
import { createMemoryLedgerRepository } from '@/services/storage/ledger/memoryLedgerRepository'
import { BTC, must, T0 } from '@/test-utils/makeEntries'
import { makeQuote } from '@/test-utils/makeQuote'

import type { OrderRequest } from '@/application/ledger/placeOrder'
import type { TradingPolicy } from '@/application/ledger/policy'
import type { LedgerRepository, LedgerRepositoryError } from '@/application/ledger/ports'
import type { Result } from '@/domain/shared/result'
import type { IndexedDbLedgerRepository } from '@/services/storage/ledger/indexedDbLedgerRepository'

const MINUTE = 60_000

interface TestClock {
  now: number
}

const idbRepositories = new Set<IndexedDbLedgerRepository>()
const databaseNames = new Set<string>()
let nextDatabaseId = 0

function freshDatabaseName(): string {
  const name = `omega-use-cases-test-${Date.now()}-${nextDatabaseId++}`

  databaseNames.add(name)

  return name
}

/** Each call simulates a tab; separate repositories can point to the same database. */
function createIdbRepository(dbName: string): IndexedDbLedgerRepository {
  const repository = createIndexedDbLedgerRepository({ dbName })

  idbRepositories.add(repository)

  return repository
}

afterEach(async () => {
  await Promise.all([...idbRepositories].map((repository) => repository.close()))
  idbRepositories.clear()
  await Promise.all([...databaseNames].map((name) => deleteDB(name)))
  databaseNames.clear()
})

/** Use a distinct prefix per tab so concurrency tests exercise the rule, not duplicate IDs. */
function setup(
  repository: LedgerRepository,
  clock: TestClock,
  prefix: string,
  policy: TradingPolicy = DEFAULT_TRADING_POLICY,
) {
  let counter = 0
  const deps = {
    repository,
    now: () => clock.now,
    newId: () => `${prefix}-${++counter}`,
  }

  return {
    openAccount: createOpenAccount(deps),
    resetAccount: createResetAccount(deps),
    placeOrder: createPlaceOrder({ ...deps, policy }),
  }
}

function order(
  side: 'buy' | 'sell',
  quantity: string,
  price: string,
  timestamp = T0,
): OrderRequest {
  return {
    side,
    quantity: Quantity.of(quantity),
    quote: makeQuote('bitcoin', { price: Price.of(price), timestamp }),
  }
}

function failureOf<T>(result: Result<T, LedgerRepositoryError>): LedgerRepositoryError {
  if (result.ok) throw new Error('Expected a failure, received ok')

  return result.error
}

async function snapshotOf(repository: LedgerRepository) {
  return must(await repository.load())
}

const repositoryKinds: ReadonlyArray<[string, () => LedgerRepository]> = [
  ['memory', () => createMemoryLedgerRepository()],
  ['IndexedDB', () => createIdbRepository(freshDatabaseName())],
]

describe.each(repositoryKinds)('ledger use cases (%s)', (_name, createRepository) => {
  const newScenario = () => {
    const repository = createRepository()
    const clock: TestClock = { now: T0 }

    return { repository, clock, ...setup(repository, clock, 'tab') }
  }

  describe('openAccount', () => {
    it('creates one USD 10,000 deposit with the injected ID and timestamp', async () => {
      // Arrange
      const { repository, clock, openAccount } = newScenario()
      clock.now = T0 + 123

      // Act
      const result = await openAccount()

      // Assert
      const { entries, state } = must(result)
      expect(entries).toHaveLength(1)
      expect(entries[0]).toMatchObject({ kind: 'deposit', id: 'tab-1', createdAt: T0 + 123 })
      expect(entries[0]).toMatchObject({ amount: INITIAL_CASH })
      expect(state.cash.toString()).toBe('10000.00')
      expect(state.deposited.toString()).toBe('10000.00')
      expect((await snapshotOf(repository)).entries).toHaveLength(1)
    })

    it('rejects a second open with ACCOUNT_ALREADY_OPEN without changing the ledger', async () => {
      // Arrange
      const { repository, openAccount } = newScenario()
      must(await openAccount())
      const before = await snapshotOf(repository)

      // Act
      const second = await openAccount()

      // Assert
      expect(failureOf(second)).toEqual({
        kind: 'REJECTED',
        rejection: { kind: 'ACCOUNT_ALREADY_OPEN' },
      })
      const after = await snapshotOf(repository)
      expect(after.entries).toEqual(before.entries)
      expect(after.state.cash.toString()).toBe('10000.00')
    })

    it('rejects opening when the ledger already has transactions', async () => {
      // Arrange
      const { openAccount, placeOrder } = newScenario()
      must(await openAccount())
      must(await placeOrder(order('buy', '0.1', '50000')))

      // Act
      const result = await openAccount()

      // Assert
      expect(failureOf(result)).toEqual({
        kind: 'REJECTED',
        rejection: { kind: 'ACCOUNT_ALREADY_OPEN' },
      })
    })
  })

  describe('resetAccount', () => {
    it('resets after trading to USD 10,000, one entry, and no positions', async () => {
      // Arrange
      const { repository, openAccount, placeOrder, resetAccount } = newScenario()
      must(await openAccount())
      must(await placeOrder(order('buy', '0.1', '50000')))

      // Act
      const result = await resetAccount()

      // Assert
      const { entries, state } = must(result)
      expect(entries).toHaveLength(1)
      expect(entries[0]?.kind).toBe('deposit')
      expect(state.cash.toString()).toBe('10000.00')
      expect(state.positions.size).toBe(0)
      expect(state.realizedPnl.toString()).toBe('0.00')
      expect((await snapshotOf(repository)).entries).toHaveLength(1)
    })

    it('works on an empty ledger', async () => {
      // Arrange
      const { resetAccount } = newScenario()

      // Act
      const result = await resetAccount()

      // Assert
      const { entries, state } = must(result)
      expect(entries).toHaveLength(1)
      expect(state.cash.toString()).toBe('10000.00')
    })

    it('allows trading again with IDs that do not collide with previous entries', async () => {
      // Arrange
      const { openAccount, resetAccount, placeOrder } = newScenario()
      must(await openAccount())
      must(await resetAccount())

      // Act
      const result = await placeOrder(order('buy', '0.1', '50000'))

      // Assert
      expect(must(result).state.cash.toString()).toBe('4995.00')
    })
  })

  describe('placeOrder: buy', () => {
    it('deducts the price and fee, creates a position, and uses the injected ID and timestamp', async () => {
      // Arrange
      const { clock, openAccount, placeOrder } = newScenario()
      must(await openAccount())
      clock.now = T0 + MINUTE

      // Act
      const result = await placeOrder(order('buy', '0.1', '50000'))

      // Assert
      const { entries, state } = must(result)
      expect(state.cash.toString()).toBe('4995.00')
      expect(state.totalFees.toString()).toBe('5.00')
      expect(state.positions.get(BTC)?.quantity.toString()).toBe('0.1')
      expect(state.positions.get(BTC)?.costBasis.toString()).toBe('5005.00')
      expect(entries).toHaveLength(2)
      expect(entries[1]).toMatchObject({
        kind: 'buy',
        id: 'tab-2',
        assetId: BTC,
        createdAt: T0 + MINUTE,
      })
    })
  })

  describe('placeOrder: sell', () => {
    it('has realizedPnl of 244.75 after buying 0.1 and selling 0.05 at 55,000', async () => {
      // Arrange
      const { openAccount, placeOrder } = newScenario()
      must(await openAccount())
      must(await placeOrder(order('buy', '0.1', '50000')))

      // Act
      const result = await placeOrder(order('sell', '0.05', '55000'))

      // Assert
      const { state } = must(result)
      expect(state.realizedPnl.toString()).toBe('244.75')
      expect(state.cash.toString()).toBe('7742.25')
      expect(state.positions.get(BTC)?.quantity.toString()).toBe('0.05')
    })

    it('closes the position when selling the full amount', async () => {
      // Arrange
      const { openAccount, placeOrder } = newScenario()
      must(await openAccount())
      must(await placeOrder(order('buy', '0.1', '50000')))

      // Act
      const result = await placeOrder(order('sell', '0.1', '50000'))

      // Assert
      expect(must(result).state.positions.size).toBe(0)
    })
  })

  describe('placeOrder: rejections', () => {
    it('rejects selling without a position with INSUFFICIENT_POSITION', async () => {
      // Arrange
      const { openAccount, placeOrder } = newScenario()
      must(await openAccount())

      // Act
      const result = await placeOrder(order('sell', '0.1', '50000'))

      // Assert
      const error = failureOf(result)
      if (error.kind !== 'REJECTED' || error.rejection.kind !== 'INSUFFICIENT_POSITION') {
        throw new Error(`rechazo inesperado: ${JSON.stringify(error)}`)
      }
      expect(error.rejection.requested.toString()).toBe('0.1')
      expect(error.rejection.available.toString()).toBe('0')
    })

    it('rejects buying without an account (no cash) with INSUFFICIENT_CASH', async () => {
      // Arrange
      const { placeOrder } = newScenario()

      // Act
      const result = await placeOrder(order('buy', '0.1', '50000'))

      // Assert
      expect(failureOf(result)).toMatchObject({
        kind: 'REJECTED',
        rejection: { kind: 'INSUFFICIENT_CASH' },
      })
    })

    it('rejects purchases above available cash with INSUFFICIENT_CASH and the amounts', async () => {
      // Arrange
      const { openAccount, placeOrder } = newScenario()
      must(await openAccount())

      // Act
      const result = await placeOrder(order('buy', '0.21', '50000'))

      // Assert
      const error = failureOf(result)
      if (error.kind !== 'REJECTED' || error.rejection.kind !== 'INSUFFICIENT_CASH') {
        throw new Error(`rechazo inesperado: ${JSON.stringify(error)}`)
      }
      expect(error.rejection.required.toString()).toBe('10510.50')
      expect(error.rejection.available.toString()).toBe('10000.00')
    })

    it('rejects a zero quantity with INVALID_QUANTITY', async () => {
      // Arrange
      const { openAccount, placeOrder } = newScenario()
      must(await openAccount())

      // Act
      const result = await placeOrder(order('buy', '0', '50000'))

      // Assert
      expect(failureOf(result)).toMatchObject({
        kind: 'REJECTED',
        rejection: { kind: 'INVALID_QUANTITY' },
      })
    })

    it('rejects a zero price with INVALID_PRICE', async () => {
      // Arrange
      const { openAccount, placeOrder } = newScenario()
      must(await openAccount())

      // Act
      const result = await placeOrder(order('buy', '0.1', '0'))

      // Assert
      expect(failureOf(result)).toMatchObject({
        kind: 'REJECTED',
        rejection: { kind: 'INVALID_PRICE' },
      })
    })

    it('rejects a purchase worth $0.00 with ORDER_TOO_SMALL', async () => {
      // Arrange
      const { openAccount, placeOrder } = newScenario()
      must(await openAccount())

      // Act
      const result = await placeOrder(order('buy', '0.00000001', '1'))

      // Assert
      expect(failureOf(result)).toMatchObject({
        kind: 'REJECTED',
        rejection: { kind: 'ORDER_TOO_SMALL' },
      })
    })

    it('does not save a rejected order', async () => {
      // Arrange
      const { repository, openAccount, placeOrder } = newScenario()
      must(await openAccount())
      must(await placeOrder(order('buy', '0.1', '50000')))
      const before = await snapshotOf(repository)

      // Act
      const rejected = await placeOrder(order('sell', '5', '50000'))

      // Assert
      expect(rejected.ok).toBe(false)
      const after = await snapshotOf(repository)
      expect(after.entries).toEqual(before.entries)
      expect(after.state.cash.toString()).toBe('4995.00')
    })
  })

  describe('placeOrder: quote age', () => {
    it('accepts a quote when the clock is exactly T0 + 5 minutes', async () => {
      // Arrange
      const { clock, openAccount, placeOrder } = newScenario()
      must(await openAccount())
      clock.now = T0 + 5 * MINUTE

      // Act
      const result = await placeOrder(order('buy', '0.1', '50000'))

      // Assert
      expect(result.ok).toBe(true)
    })

    it('rejects a quote at T0 + 5 minutes + 1 ms with the correct ageMs and maxAgeMs', async () => {
      // Arrange
      const { repository, clock, openAccount, placeOrder } = newScenario()
      must(await openAccount())
      clock.now = T0 + 5 * MINUTE + 1

      // Act
      const result = await placeOrder(order('buy', '0.1', '50000'))

      // Assert
      expect(failureOf(result)).toEqual({
        kind: 'REJECTED',
        rejection: { kind: 'STALE_QUOTE', ageMs: 5 * MINUTE + 1, maxAgeMs: 5 * MINUTE },
      })
      expect((await snapshotOf(repository)).entries).toHaveLength(1)
    })

    it('accepts a 4-minute-old quote (a normal CoinGecko quote)', async () => {
      // Arrange
      const { clock, openAccount, placeOrder } = newScenario()
      must(await openAccount())
      clock.now = T0 + 4 * MINUTE

      // Act
      const result = await placeOrder(order('buy', '0.1', '50000'))

      // Assert
      expect(result.ok).toBe(true)
    })

    it('respects the injected policy', async () => {
      // Arrange
      const repository = createRepository()
      const clock: TestClock = { now: T0 }
      const strict = setup(repository, clock, 'strict', { feeBps: 10, maxQuoteAgeMs: MINUTE })
      must(await strict.openAccount())
      clock.now = T0 + MINUTE + 1

      // Act
      const result = await strict.placeOrder(order('buy', '0.1', '50000'))

      // Assert
      expect(failureOf(result)).toMatchObject({
        rejection: { kind: 'STALE_QUOTE', maxAgeMs: MINUTE },
      })
    })

    it('does not consider a future quote stale when the clock is skewed', async () => {
      // Arrange
      const { openAccount, placeOrder } = newScenario()
      must(await openAccount())

      // Act
      const result = await placeOrder(order('buy', '0.1', '50000', T0 + MINUTE))

      // Assert
      expect(result.ok).toBe(true)
    })
  })

  describe('placeOrder: decision time', () => {
    it('records each order with the clock timestamp at decision time', async () => {
      // Arrange
      const { clock, openAccount, placeOrder } = newScenario()
      clock.now = T0
      must(await openAccount())

      // Act
      clock.now = T0 + MINUTE
      must(await placeOrder(order('buy', '0.05', '50000')))
      clock.now = T0 + 2 * MINUTE
      const result = await placeOrder(order('buy', '0.05', '50000'))

      // Assert
      expect(must(result).entries.map((entry) => entry.createdAt)).toEqual([
        T0,
        T0 + MINUTE,
        T0 + 2 * MINUTE,
      ])
    })
  })
})

describe('ledger use cases across multiple tabs (IndexedDB)', () => {
  it('allows exactly one of two simultaneous account opens to succeed', async () => {
    // Arrange
    const dbName = freshDatabaseName()
    const clock: TestClock = { now: T0 }
    const tabA = setup(createIdbRepository(dbName), clock, 'a')
    const tabB = setup(createIdbRepository(dbName), clock, 'b')

    // Act
    const results = await Promise.all([tabA.openAccount(), tabB.openAccount()])

    // Assert
    const winners = results.filter((result) => result.ok)
    const losers = results.filter((result) => !result.ok)
    expect(winners).toHaveLength(1)
    expect(losers.map((result) => failureOf(result))).toEqual([
      { kind: 'REJECTED', rejection: { kind: 'ACCOUNT_ALREADY_OPEN' } },
    ])
    const stored = await snapshotOf(createIdbRepository(dbName))
    expect(stored.entries).toHaveLength(1)
    expect(stored.state.cash.toString()).toBe('10000.00')
  })

  it('allows only one of two tabs to buy 0.12 BTC (USD 6,006) with USD 10,000 and keeps cash non-negative', async () => {
    // Arrange
    const dbName = freshDatabaseName()
    const clock: TestClock = { now: T0 }
    const tabA = setup(createIdbRepository(dbName), clock, 'a')
    const tabB = setup(createIdbRepository(dbName), clock, 'b')
    must(await tabA.openAccount())

    // Act
    const results = await Promise.all([
      tabA.placeOrder(order('buy', '0.12', '50000')),
      tabB.placeOrder(order('buy', '0.12', '50000')),
    ])

    // Assert
    expect(results.filter((result) => result.ok)).toHaveLength(1)
    const failures = results.filter((result) => !result.ok).map((result) => failureOf(result))
    expect(failures).toHaveLength(1)
    expect(failures[0]).toMatchObject({
      kind: 'REJECTED',
      rejection: { kind: 'INSUFFICIENT_CASH' },
    })
    const stored = await snapshotOf(createIdbRepository(dbName))
    expect(stored.entries).toHaveLength(2)
    expect(stored.state.cash.toString()).toBe('3994.00')
    expect(stored.state.cash.isNegative()).toBe(false)
  })

  it('preserves orders after closing and reopening IndexedDB', async () => {
    // Arrange
    const dbName = freshDatabaseName()
    const clock: TestClock = { now: T0 }
    const firstRepository = createIdbRepository(dbName)
    const tab = setup(firstRepository, clock, 'a')
    must(await tab.openAccount())
    must(await tab.placeOrder(order('buy', '0.1', '50000')))
    must(await tab.placeOrder(order('sell', '0.05', '55000')))
    await firstRepository.close()

    // Act
    const reopened = await createIdbRepository(dbName).load()

    // Assert
    const { entries, state } = must(reopened)
    expect(entries.map((entry) => entry.id)).toEqual(['a-1', 'a-2', 'a-3'])
    expect(state.cash.toString()).toBe('7742.25')
    expect(state.realizedPnl.toString()).toBe('244.75')
    expect(state.positions.get(BTC)?.quantity.toString()).toBe('0.05')
  })
})
