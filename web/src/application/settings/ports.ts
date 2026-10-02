import type { ThemeMode } from '@/domain/settings/theme'
import type { Result } from '@/domain/shared/result'
import type { StorageError } from '@/services/storage/storageError'

export interface ThemeRepository {
  load(): ThemeMode
  save(mode: ThemeMode): Result<void, StorageError>
}
