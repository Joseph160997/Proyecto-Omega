import { create } from 'zustand'
import { z } from 'zod'

export const ThemeModeSchema = z.enum(['dark', 'light'])

export type ThemeMode = z.infer<typeof ThemeModeSchema>

const THEME_STORAGE_KEY = 'omega-markets:settings:theme:v1'

const PersistedThemeSchema = z.object({
  version: z.literal(1),
  mode: ThemeModeSchema,
})

interface ThemeState {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggle: () => void
}

function readStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY)

    if (!raw) {
      return 'dark'
    }

    const parsed = PersistedThemeSchema.safeParse(JSON.parse(raw))

    if (!parsed.success) {
      return 'dark'
    }

    return parsed.data.mode
  } catch {
    return 'dark'
  }
}

function writeStoredTheme(mode: ThemeMode) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const payload = PersistedThemeSchema.parse({
      version: 1,
      mode,
    })

    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Si storage falla, la app sigue funcionando en memoria.
  }
}

export const useThemeStore = create<ThemeState>()((set, get) => ({
  mode: readStoredTheme(),

  setMode: (mode) => {
    writeStoredTheme(mode)
    set({ mode })
  },

  toggle: () => {
    const nextMode = get().mode === 'dark' ? 'light' : 'dark'

    writeStoredTheme(nextMode)
    set({ mode: nextMode })
  },
}))