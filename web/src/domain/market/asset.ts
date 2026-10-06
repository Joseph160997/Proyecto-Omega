import { err, ok } from '@/domain/shared/result'

import type { Result } from '@/domain/shared/result'

export const ASSET_TYPES = ['crypto', 'stock', 'index', 'forex', 'commodity'] as const

export type AssetType = (typeof ASSET_TYPES)[number]

export type AssetIdError = { kind: 'INVALID_ASSET_ID' }

export interface ParsedAssetId {
  type: AssetType
  symbol: string
}

// Minúsculas, empieza con letra o dígito, hasta 20 caracteres. Admite "brk.b" o "sp-500".
const SYMBOL = /^[a-z0-9][a-z0-9._-]{0,19}$/

function isAssetType(value: string): value is AssetType {
  return (ASSET_TYPES as readonly string[]).includes(value)
}

/**
 * Construye un id canónico ("crypto:btc") desde datos de una API.
 * Normaliza a minúsculas; rechaza símbolos que no entran en el formato.
 */
export function makeAssetId(type: AssetType, symbol: string): Result<string, AssetIdError> {
  const normalized = symbol.trim().toLowerCase()

  return SYMBOL.test(normalized) ? ok(`${type}:${normalized}`) : err({ kind: 'INVALID_ASSET_ID' })
}

/** Descompone un id canónico. No normaliza: "crypto:BTC" se rechaza. */
export function parseAssetId(id: string): Result<ParsedAssetId, AssetIdError> {
  const separator = id.indexOf(':')

  if (separator === -1) return err({ kind: 'INVALID_ASSET_ID' })

  const type = id.slice(0, separator)
  const symbol = id.slice(separator + 1)

  if (!isAssetType(type) || !SYMBOL.test(symbol)) {
    return err({ kind: 'INVALID_ASSET_ID' })
  }

  return ok({ type, symbol })
}
