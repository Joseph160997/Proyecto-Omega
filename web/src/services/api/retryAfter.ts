const MAX_RETRY_AFTER_MS = 24 * 60 * 60 * 1000

/**
 * Interpreta la cabecera Retry-After (segundos enteros o fecha HTTP en GMT).
 * Devuelve milisegundos de espera, acotados a 24 h, o undefined si no se entiende.
 */
export function parseRetryAfter(value: string | null, nowMs: number): number | undefined {
  if (value === null) return undefined

  const trimmed = value.trim()

  if (/^\d{1,9}$/.test(trimmed)) {
    return Math.min(Number(trimmed) * 1000, MAX_RETRY_AFTER_MS)
  }

  // El formato de fecha HTTP siempre termina en GMT. Exigirlo evita que el
  // parser permisivo de Date acepte basura como "-5" o "1.5".
  if (!/ GMT$/.test(trimmed)) return undefined

  const date = Date.parse(trimmed)
  if (Number.isNaN(date)) return undefined

  return Math.min(Math.max(0, date - nowMs), MAX_RETRY_AFTER_MS)
}
