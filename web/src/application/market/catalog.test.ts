import { describe, expect, it } from 'vitest'

import { CRYPTO_CATALOG } from '@/application/market/catalog'
import { parseAssetId } from '@/domain/market/asset'

describe('CRYPTO_CATALOG', () => {
  it.each([...CRYPTO_CATALOG])('%s is a canonical crypto assetId', (assetId) => {
    const parsed = parseAssetId(assetId)

    expect(parsed.ok && parsed.value.type).toBe('crypto')
  })

  it('contains no duplicate asset IDs', () => {
    expect(new Set(CRYPTO_CATALOG).size).toBe(CRYPTO_CATALOG.length)
  })
})
