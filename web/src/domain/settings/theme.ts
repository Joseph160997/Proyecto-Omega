export const THEME_MODES = ['dark', 'light'] as const

export type ThemeMode = (typeof THEME_MODES)[number]

export const DEFAULT_THEME_MODE: ThemeMode = 'dark'

export function toggleThemeMode(mode: ThemeMode): ThemeMode {
  return mode === 'dark' ? 'light' : 'dark'
}
