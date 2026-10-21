import { createMemoryStorage } from '@/services/storage/memoryStorage'
import { createThemeRepository } from '@/services/storage/themeRepository'
import { createHttpClient } from '@/services/api/httpClient'
import { createCoinGeckoProvider } from '@/services/api/providers/coingecko/coingeckoProvider'
import { createOpenAccount, createResetAccount } from '@/application/ledger/account'
import { DEFAULT_TRADING_POLICY } from '@/application/ledger/policy'
import { createPlaceOrder } from '@/application/ledger/placeOrder'
import { err, ok } from '@/domain/shared/result'
import { resolveLedgerRepository } from '@/services/storage/ledger/resolveLedgerRepository'
import { createThemeStore } from '@/stores/theme.store'

import type { LedgerRepositoryError, LedgerSnapshot } from '@/application/ledger/ports'
import type { PlaceOrder } from '@/application/ledger/placeOrder'
import type { DegradedReason } from '@/services/storage/ledger/resolveLedgerRepository'
import type { Result } from '@/domain/shared/result'
import type { MarketDataProvider, MarketListingProvider } from '@/application/market/ports'
import type { KeyValueStorage } from '@/services/storage/jsonStorage'

export interface LedgerServices {
  readonly snapshot: LedgerSnapshot | undefined
  readonly persistent: boolean
  readonly degraded?: { readonly reason: DegradedReason }
  readonly loadSnapshot: () => Promise<Result<LedgerSnapshot, LedgerRepositoryError>>
  readonly openAccount: () => Promise<Result<LedgerSnapshot, LedgerRepositoryError>>
  readonly resetAccount: () => Promise<Result<LedgerSnapshot, LedgerRepositoryError>>
  readonly placeOrder: PlaceOrder
}

let ledgerServicesPromise: Promise<Result<LedgerServices, LedgerRepositoryError>> | undefined

async function createLedgerServices(): Promise<Result<LedgerServices, LedgerRepositoryError>> {
  const resolved = await resolveLedgerRepository()
  const { repository } = resolved
  const snapshot = await repository.load()

  const deps = { repository, now: Date.now, newId: () => crypto.randomUUID() }

  return ok({
    snapshot: snapshot.ok ? snapshot.value : undefined,
    persistent: repository.persistent,
    degraded: resolved.degraded,
    loadSnapshot: () => repository.load(),
    openAccount: createOpenAccount(deps),
    resetAccount: createResetAccount(deps),
    placeOrder: createPlaceOrder({ ...deps, policy: DEFAULT_TRADING_POLICY }),
  })
}

export function getLedgerServices(): Promise<Result<LedgerServices, LedgerRepositoryError>> {
  if (ledgerServicesPromise !== undefined) return ledgerServicesPromise

  const pending: Promise<Result<LedgerServices, LedgerRepositoryError>> =
    createLedgerServices().catch((cause: unknown) => err({ kind: 'UNAVAILABLE', cause }))

  ledgerServicesPromise = pending
  void pending.then((result) => {
    if (!result.ok && ledgerServicesPromise === pending) ledgerServicesPromise = undefined
  })

  return pending
}

function getBrowserStorage(): KeyValueStorage {
  try {
    return window.localStorage
  } catch {
    // Acceder a localStorage puede lanzar (modo privado, cookies bloqueadas).
    return createMemoryStorage()
  }
}

const themeRepository = createThemeRepository(getBrowserStorage())

export const useThemeStore = createThemeStore(themeRepository)

const httpClient = createHttpClient()

const coingecko = createCoinGeckoProvider({ http: httpClient })

export const marketDataProvider: MarketDataProvider = coingecko
export const marketListingProvider: MarketListingProvider = coingecko
