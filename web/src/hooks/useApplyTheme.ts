import { useEffect } from 'react'

import { useThemeStore } from '@/app/container'

export function useApplyTheme() {
  const mode = useThemeStore((state) => state.mode)

  useEffect(() => {
    const root = document.documentElement

    root.classList.toggle('dark', mode === 'dark')
    root.style.colorScheme = mode
  }, [mode])

  return mode
}
