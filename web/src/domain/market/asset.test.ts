import { describe, expect, it } from 'vitest'

import { ASSET_TYPES, makeAssetId, parseAssetId } from '@/domain/market/asset'

import type { AssetType } from '@/domain/market/asset'

describe('makeAssetId', () => {
  const valid: Array<[AssetType, string, string]> = [
    ['crypto', 'bitcoin', 'crypto:bitcoin'],
    ['crypto', '  Ethereum ', 'crypto:ethereum'],
    ['crypto', 'avalanche-2', 'crypto:avalanche-2'],
    ['stock', 'BRK.B', 'stock:brk.b'],
    ['forex', 'EURUSD', 'forex:eurusd'],
    ['crypto', 'a'.repeat(64), `crypto:${'a'.repeat(64)}`],
  ]

  it.each(valid)('%s + %j → %s', (type, key, expected) => {
    const result = makeAssetId(type, key)

    expect(result.ok && result.value).toBe(expected)
  })

  it.each([
    [''],
    ['   '],
    ['EUR/USD'],
    ['$MOON'],
    ['a b'],
    ['ＢＴＣ'], // full-width characters
    ['-btc'],
    ['a'.repeat(65)],
  ])('rejects %j', (key) => {
    expect(makeAssetId('crypto', key)).toEqual({
      ok: false,
      error: { kind: 'INVALID_ASSET_ID' },
    })
  })
})

describe('parseAssetId', () => {
  it('decomposes a canonical ID', () => {
    expect(parseAssetId('crypto:bitcoin')).toEqual({
      ok: true,
      value: { type: 'crypto', key: 'bitcoin' },
    })
  })

  it.each([...ASSET_TYPES])('is the inverse of makeAssetId for %s', (type) => {
    const made = makeAssetId(type, 'abc1')

    expect(made.ok && parseAssetId(made.value)).toEqual({
      ok: true,
      value: { type, key: 'abc1' },
    })
  })

  it.each([
    [''],
    ['bitcoin'],
    [':bitcoin'],
    ['crypto:'],
    ['foo:bitcoin'],
    ['crypto:Bitcoin'],
    ['crypto:a:b'],
    [' crypto:bitcoin'],
    ['crypto:bitcoin '],
  ])('rejects %j', (id) => {
    expect(parseAssetId(id).ok).toBe(false)
  })
})
