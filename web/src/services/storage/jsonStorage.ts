import type { z } from 'zod'

import { err, ok, type Result } from '@/domain/shared/result'
import type { StorageError } from '@/services/storage/storageError'

/** Lo mínimo que necesitamos de un storage. localStorage ya lo cumple. */
export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function readJson<T>(
  storage: KeyValueStorage,
  key: string,
  schema: z.ZodType<T>,
): Result<T, StorageError> {
  let raw: string | null
  try {
    raw = storage.getItem(key)
  } catch (cause) {
    return err({ kind: 'UNAVAILABLE', cause })
  }
  if (raw === null) return err({ kind: 'NOT_FOUND' })

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return err({ kind: 'CORRUPT_JSON' })
  }

  const parsed = schema.safeParse(json)
  return parsed.success
    ? ok(parsed.data)
    : err({ kind: 'SCHEMA_MISMATCH', issues: parsed.error.issues.map((i) => i.message) })
}

export function writeJson(
  storage: KeyValueStorage,
  key: string,
  value: unknown,
): Result<void, StorageError> {
  try {
    storage.setItem(key, JSON.stringify(value))
    return ok(undefined)
  } catch (cause) {
    const isQuota = cause instanceof DOMException && cause.name === 'QuotaExceededError'
    return err(isQuota ? { kind: 'QUOTA_EXCEEDED' } : { kind: 'UNAVAILABLE', cause })
  }
}
