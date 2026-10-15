import { describe, expect, it } from 'vitest'

import { HOME_TITLE, normalizeSiteUrl, OG_IMAGE, SEO_ASSETS, SITE_DESCRIPTION } from './site.ts'

describe('normalizeSiteUrl', () => {
  it.each([
    ['https://omega.example', 'https://omega.example'],
    ['https://omega.example/', 'https://omega.example'],
    ['  https://omega.example/markets?x=1#y  ', 'https://omega.example'],
    ['http://localhost:5173', 'http://localhost:5173'],
    ['HTTPS://Omega.Example', 'https://omega.example'],
  ])('%j normalizes to %s', (raw, expected) => {
    expect(normalizeSiteUrl(raw)).toBe(expected)
  })

  it.each([
    undefined,
    '',
    '   ',
    'omega.example',
    'ftp://omega.example',
    'javascript:alert(1)',
    'https://',
  ])('%j is not a valid site URL and returns undefined', (raw) => {
    expect(normalizeSiteUrl(raw)).toBeUndefined()
  })
})

describe('site data', () => {
  it('keeps the title and description within search result limits', () => {
    expect(HOME_TITLE.length).toBeLessThanOrEqual(60)
    expect(SITE_DESCRIPTION.length).toBeLessThanOrEqual(160)
  })

  it('uses the recommended social image aspect ratio (1200×630)', () => {
    expect(OG_IMAGE.width / OG_IMAGE.height).toBeCloseTo(1200 / 630)
  })

  it('declares unique assets with valid paths and dimensions', () => {
    const paths = SEO_ASSETS.map((asset) => asset.path)

    expect(new Set(paths).size).toBe(paths.length)
    SEO_ASSETS.forEach((asset) => {
      expect(asset.path.startsWith('/')).toBe(true)
      expect(asset.path.endsWith('.png')).toBe(true)
      expect(asset.width).toBeGreaterThan(0)
      expect(asset.height).toBeGreaterThan(0)
    })
  })
})
