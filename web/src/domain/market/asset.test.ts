import { describe, expect, it } from 'vitest'

import { ASSET_TYPES, makeAssetId, parseAssetId } from '@/domain/market/asset'

import type { AssetType } from '@/domain/market/asset'

describe('makeAssetId', () => {
  const valid: Array<[AssetType, string, string]> = [
    ['crypto', 'BTC', 'crypto:btc'],
    ['crypto', '  Eth ', 'crypto:eth'],
    ['stock', 'BRK.B', 'stock:brk.b'],
    ['forex', 'EURUSD', 'forex:eurusd'],
    ['index', 'sp-500', 'index:sp-500'],
    ['crypto', 'a'.repeat(20), `crypto:${'a'.repeat(20)}`],
  ]

  it.each(valid)('%s + %j → %s', (type, symbol, expected) => {
    const result = makeAssetId(type, symbol)

    expect(result.ok && result.value).toBe(expected)
  })

  it.each([[''], ['   '], ['EUR/USD'], ['$MOON'], ['a b'], ['ＢＴＣ'], ['-btc'], ['a'.repeat(21)]])(
    'rejects %j',
    (symbol) => {
      expect(makeAssetId('crypto', symbol)).toEqual({
        ok: false,
        error: { kind: 'INVALID_ASSET_ID' },
      })
    },
  )
})

describe('parseAssetId', () => {
  it('decomposes a canonical id', () => {
    expect(parseAssetId('crypto:btc')).toEqual({
      ok: true,
      value: { type: 'crypto', symbol: 'btc' },
    })
  })

  it.each([...ASSET_TYPES])('is the inverse of makeAssetId for %s', (type) => {
    const made = makeAssetId(type, 'abc1')

    expect(made.ok && parseAssetId(made.value)).toEqual({
      ok: true,
      value: { type, symbol: 'abc1' },
    })
  })

  it.each([
    [''],
    ['btc'],
    [':btc'],
    ['crypto:'],
    ['foo:btc'],
    ['crypto:BTC'],
    ['crypto:a:b'],
    [' crypto:btc'],
    ['crypto:btc '],
  ])('rejects %j', (id) => {
    expect(parseAssetId(id).ok).toBe(false)
  })
})
