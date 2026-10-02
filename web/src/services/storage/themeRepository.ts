import { z } from 'zod'

import { DEFAULT_THEME_MODE, THEME_MODES } from '@/domain/settings/theme'
import { err, ok } from '@/domain/shared/result'
import { readJson, writeJson } from '@/services/storage/jsonStorage'

import type { ThemeRepository } from '@/application/settings/ports'
import type { KeyValueStorage } from '@/services/storage/jsonStorage'

export const THEME_STORAGE_KEY = 'omega-markets:settings:theme:v1'

const PersistedThemeSchema = z.object({
  version: z.literal(1),
  mode: z.enum(THEME_MODES),
})

export function createThemeRepository(storage: KeyValueStorage): ThemeRepository {
  return {
    load: () => {
      const result = readJson(storage, THEME_STORAGE_KEY, PersistedThemeSchema)
      return result.ok ? result.value.mode : DEFAULT_THEME_MODE
    },

    save: (mode) => {
      const result = writeJson(storage, THEME_STORAGE_KEY, { version: 1, mode })
      return result.ok ? ok(undefined) : err(result.error)
    },
  }
}
