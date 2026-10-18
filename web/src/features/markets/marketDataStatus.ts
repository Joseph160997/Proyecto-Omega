import { formatAge } from '@/lib/format'
import { DEFAULT_MAX_QUOTE_AGE_MS } from '@/domain/market/quote'

/** Cuánto tiempo sin datos nuevos antes de avisar de que están desactualizados. */
export const STALE_AFTER_MS = DEFAULT_MAX_QUOTE_AGE_MS

export type DataStatus =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'refreshing'; ageMs: number }
  | { kind: 'fresh'; ageMs: number }
  | { kind: 'stale'; ageMs: number }
  | { kind: 'failed'; ageMs: number | undefined }

export interface DataStatusInput {
  isFetching: boolean
  isError: boolean
  /** Marca de tiempo (del proveedor) del dato más reciente; undefined si no hay datos. */
  newestTimestamp: number | undefined
  now: number
}

export function deriveDataStatus({
  isFetching,
  isError,
  newestTimestamp,
  now,
}: DataStatusInput): DataStatus {
  const hasData = newestTimestamp !== undefined
  const ageMs = hasData ? Math.max(0, now - newestTimestamp) : undefined

  if (!hasData && isFetching) return { kind: 'loading' }
  if (ageMs !== undefined && isFetching) return { kind: 'refreshing', ageMs }
  if (isError) return { kind: 'failed', ageMs }
  if (ageMs === undefined) return { kind: 'idle' }

  return ageMs > STALE_AFTER_MS ? { kind: 'stale', ageMs } : { kind: 'fresh', ageMs }
}

export type StatusTone = 'ok' | 'warn' | 'busy'

export interface StatusView {
  tone: StatusTone
  label: string
}

/** Cómo se muestra cada estado. `null` = no hay nada que mostrar. */
export function describeDataStatus(status: DataStatus): StatusView | null {
  switch (status.kind) {
    case 'idle':
      return null
    case 'loading':
      return { tone: 'busy', label: 'Cargando datos…' }
    case 'refreshing':
      return { tone: 'busy', label: 'Actualizando…' }
    case 'fresh':
      return { tone: 'ok', label: `Datos de ${formatAge(status.ageMs)}` }
    case 'stale':
      return { tone: 'warn', label: `Datos de ${formatAge(status.ageMs)}` }
    case 'failed':
      return {
        tone: 'warn',
        label:
          status.ageMs === undefined
            ? 'Sin conexión con los datos de mercado'
            : `Datos de ${formatAge(status.ageMs)} · sin actualizar`,
      }
    default: {
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}
