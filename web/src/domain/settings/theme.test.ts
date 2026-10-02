import { describe, expect, it } from 'vitest'

import { toggleThemeMode } from '@/domain/settings/theme'

describe('toggleThemeMode', () => {
  it('toggles between dark and light', () => {
    // Arrange
    const darkMode = 'dark'
    const lightMode = 'light'

    // Act
    const toggledFromDark = toggleThemeMode(darkMode)
    const toggledFromLight = toggleThemeMode(lightMode)

    // Assert
    expect(toggledFromDark).toBe('light')
    expect(toggledFromLight).toBe('dark')
  })
})
