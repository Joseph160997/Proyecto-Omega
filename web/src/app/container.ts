import { createMemoryStorage } from '@/services/storage/memoryStorage'
import { createThemeRepository } from '@/services/storage/themeRepository'
import { createThemeStore } from '@/stores/theme.store'

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
