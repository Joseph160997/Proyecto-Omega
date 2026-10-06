import { describe, expect, it } from 'vitest'

import { CRYPTO_CATALOG } from '@/application/market/catalog'
import { parseAssetId } from '@/domain/market/asset'
import { COINGECKO_IDS } from '@/services/api/providers/coingecko/coingeckoCatalog'

describe('COINGECKO_IDS', () => {
  it.each([...COINGECKO_IDS.keys()])('%s is a canonical crypto assetId', (assetId) => {
    const parsed = parseAssetId(assetId)

    expect(parsed.ok && parsed.value.type).toBe('crypto')
  })

  it('does not repeat CoinGecko ids (two assetIds cannot point to the same coin)', () => {
    const values = [...COINGECKO_IDS.values()]

    expect(new Set(values).size).toBe(values.length)
  })

  it('fits within a single CoinGecko page', () => {
    expect(COINGECKO_IDS.size).toBeLessThanOrEqual(250)
  })

  it('supports every crypto asset in the app catalog', () => {
    const unsupported = CRYPTO_CATALOG.filter((assetId) => !COINGECKO_IDS.has(assetId))

    expect(unsupported).toEqual([])
  })
})
