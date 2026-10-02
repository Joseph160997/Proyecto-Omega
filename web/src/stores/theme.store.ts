import { create } from 'zustand'

import { toggleThemeMode } from '@/domain/settings/theme'

import type { ThemeRepository } from '@/application/settings/ports'
import type { ThemeMode } from '@/domain/settings/theme'

export interface ThemeState {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggle: () => void
}

export function createThemeStore(repository: ThemeRepository) {
  return create<ThemeState>()((set, get) => ({
    mode: repository.load(),

    setMode: (mode) => {
      const saveResult = repository.save(mode)
      if (!saveResult.ok) {
        console.warn('Theme could not be persisted:', saveResult.error)
      }

      set({ mode })
    },

    toggle: () => get().setMode(toggleThemeMode(get().mode)),
  }))
}
