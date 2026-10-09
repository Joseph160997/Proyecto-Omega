import type { Price } from '@/domain/shared/price'

const PLACEHOLDER = '—'

// Fixed to en-US for now; localization can be added as a separate decision.
const usd = (options: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', ...options })

const USD_STANDARD = usd({ minimumFractionDigits: 2, maximumFractionDigits: 2 })
const USD_SUB_DOLLAR = usd({ minimumFractionDigits: 4, maximumFractionDigits: 4 })
const USD_MICRO = usd({ maximumSignificantDigits: 4 })
const USD_COMPACT = usd({ notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 2 })

/** Formats a price for display, preserving meaningful precision for small values. */
export function formatUsdPrice(price: Price): string {
  const value = Number(price.toString())

  if (value === 0 || value >= 1) return USD_STANDARD.format(value)
  if (value >= 0.01) return USD_SUB_DOLLAR.format(value)

  return USD_MICRO.format(value)
}

/** Formats large values such as market capitalization and volume. */
export function formatCompactUsd(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return PLACEHOLDER

  return USD_COMPACT.format(value)
}

/** Formats a percentage change with an explicit sign. */
export function formatPercentChange(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return PLACEHOLDER

  const digits = Math.abs(value).toFixed(2)

  if (Number(digits) === 0) return '0.00%'

  return `${value > 0 ? '+' : '-'}${digits}%`
}

export type ChangeDirection = 'up' | 'down' | 'flat'

/** Matches the displayed rounding: changes rendered as 0.00% are flat. */
export function percentChangeDirection(value: number | undefined): ChangeDirection {
  if (value === undefined || !Number.isFinite(value)) return 'flat'
  if (Number(Math.abs(value).toFixed(2)) === 0) return 'flat'

  return value > 0 ? 'up' : 'down'
}

/** Formats an age; invalid, future, and sub-minute times count as recent. */
export function formatAge(ageMs: number): string {
  if (!Number.isFinite(ageMs) || ageMs < 60_000) return 'hace menos de 1 min'

  const minutes = Math.floor(ageMs / 60_000)
  if (minutes < 60) return `hace ${minutes} min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`

  return `hace ${Math.floor(hours / 24)} d`
}

/** Formats a retry delay by rounding up to a whole second or minute. */
export function formatWait(ms: number): string {
  if (!Number.isFinite(ms)) return 'unos instantes'

  const seconds = Math.max(1, Math.ceil(ms / 1000))
  if (seconds < 60) return `${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`

  const minutes = Math.ceil(seconds / 60)

  return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`
}
