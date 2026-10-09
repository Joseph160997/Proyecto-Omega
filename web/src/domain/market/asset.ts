import { err, ok } from '@/domain/shared/result'

import type { Result } from '@/domain/shared/result'

export const ASSET_TYPES = ['crypto', 'stock', 'index', 'forex', 'commodity'] as const

export type AssetType = (typeof ASSET_TYPES)[number]

export type AssetIdError = { kind: 'INVALID_ASSET_ID' }

export interface ParsedAssetId {
  type: AssetType
  /** Clave del activo dentro de su tipo: id de CoinGecko (cripto) o ticker (acciones). */
  key: string
}

// Minúsculas, empieza con letra o dígito, hasta 64 caracteres. Cubre ids de CoinGecko
// ("avalanche-2"), tickers ("brk.b") y pares ("eurusd").
const KEY = /^[a-z0-9][a-z0-9._-]{0,63}$/

function isAssetType(value: string): value is AssetType {
  return (ASSET_TYPES as readonly string[]).includes(value)
}

/**
 * Construye un id canónico ("crypto:bitcoin") desde datos de una API.
 * Normaliza a minúsculas; rechaza claves que no entran en el formato.
 */
export function makeAssetId(type: AssetType, key: string): Result<string, AssetIdError> {
  const normalized = key.trim().toLowerCase()

  return KEY.test(normalized) ? ok(`${type}:${normalized}`) : err({ kind: 'INVALID_ASSET_ID' })
}

/** Descompone un id canónico. No normaliza: "crypto:Bitcoin" se rechaza. */
export function parseAssetId(id: string): Result<ParsedAssetId, AssetIdError> {
  const separator = id.indexOf(':')

  if (separator === -1) return err({ kind: 'INVALID_ASSET_ID' })

  const type = id.slice(0, separator)
  const key = id.slice(separator + 1)

  if (!isAssetType(type) || !KEY.test(key)) {
    return err({ kind: 'INVALID_ASSET_ID' })
  }

  return ok({ type, key })
}
