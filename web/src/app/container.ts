import { createMemoryStorage } from '@/services/storage/memoryStorage'
import { createThemeRepository } from '@/services/storage/themeRepository'
import { createHttpClient } from '@/services/api/httpClient'
import { createCoinGeckoProvider } from '@/services/api/providers/coingecko/coingeckoProvider'
import { createThemeStore } from '@/stores/theme.store'

import type { MarketDataProvider, MarketListingProvider } from '@/application/market/ports'
import type { KeyValueStorage } from '@/services/storage/jsonStorage'

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
