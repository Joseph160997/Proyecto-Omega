import type { KeyValueStorage } from '@/services/storage/jsonStorage'

export function createMemoryStorage(): KeyValueStorage {
  const data = new Map<string, string>()

  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value)
    },
  }
}
