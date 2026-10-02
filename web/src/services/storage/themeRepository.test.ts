import { describe, expect, it } from 'vitest'

import { createMemoryStorage } from '@/services/storage/memoryStorage'
import { createThemeRepository, THEME_STORAGE_KEY } from '@/services/storage/themeRepository'

describe('themeRepository', () => {
  it('returns dark when nothing is stored', () => {
    const repo = createThemeRepository(createMemoryStorage())

    expect(repo.load()).toBe('dark')
  })

  it('saves and restores the selected mode', () => {
    const storage = createMemoryStorage()
    const repo = createThemeRepository(storage)

    const saveResult = repo.save('light')

    expect(saveResult.ok).toBe(true)
    expect(createThemeRepository(storage).load()).toBe('light')
  })

  it('falls back to the default value when the JSON is invalid', () => {
    const storage = createMemoryStorage()
    storage.setItem(THEME_STORAGE_KEY, '{not valid json')

    expect(createThemeRepository(storage).load()).toBe('dark')
  })

  it('falls back to the default value when the schema does not match', () => {
    const storage = createMemoryStorage()
    storage.setItem(THEME_STORAGE_KEY, JSON.stringify({ version: 1, mode: 'pink' }))

    expect(createThemeRepository(storage).load()).toBe('dark')
  })

  it('returns an error result if storage fails while writing', () => {
    const broken = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota exceeded')
      },
    }

    const result = createThemeRepository(broken).save('light')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.kind).toBe('UNAVAILABLE')
    }
  })
})
