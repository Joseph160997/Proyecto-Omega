/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { findAssetProblems, readPngSize } from './assetCheck.ts'
import { SEO_ASSETS, SITE_NAME } from './site.ts'

const PUBLIC_DIR = fileURLToPath(new URL('../../public/', import.meta.url))

/** Images not yet uploaded to `public/`; remove each path once its file is added. */
const PENDING_ASSETS: string[] = []

const existing = new Set(readdirSync(PUBLIC_DIR).map((name) => `/${name}`))

if (PENDING_ASSETS.length > 0) {
  console.warn(`[seo] Images pending upload to public/: ${PENDING_ASSETS.join(', ')}`)
}

function pngHeader(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(24)
  const view = new DataView(bytes.buffer)

  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  view.setUint32(16, width)
  view.setUint32(20, height)

  return bytes
}

describe('readPngSize', () => {
  it('reads width and height from the PNG header', () => {
    expect(readPngSize(pngHeader(1200, 630))).toEqual({ width: 1200, height: 630 })
  })

  it.each([
    [new Uint8Array(0)],
    [new Uint8Array(24)],
    [new TextEncoder().encode('<svg></svg>'.padEnd(30))],
  ])('returns null for data that is not a PNG', (bytes) => {
    expect(readPngSize(bytes)).toBeNull()
  })
})

describe('findAssetProblems', () => {
  const declared = ['/a.png', '/b.png']

  it('returns no problems when assets exist or are pending', () => {
    expect(
      findAssetProblems({ declared, existing: new Set(['/a.png']), pending: ['/b.png'] }),
    ).toEqual([])
  })

  it('reports assets that are missing and not pending', () => {
    expect(findAssetProblems({ declared, existing: new Set(['/a.png']), pending: [] })).toEqual([
      'Falta public/b.png',
    ])
  })

  it('requires existing assets to be removed from the pending list', () => {
    expect(
      findAssetProblems({ declared, existing: new Set(declared), pending: ['/b.png'] }),
    ).toEqual(['"/b.png" ya existe en public/: quítalo de PENDING_ASSETS'])
  })

  it('reports pending assets that are not declared', () => {
    expect(
      findAssetProblems({ declared, existing: new Set(declared), pending: ['/z.png'] }),
    ).toEqual(['"/z.png" está en PENDING_ASSETS pero no es un asset declarado'])
  })
})

describe('public images', () => {
  it('requires every declared asset to exist or be explicitly pending', () => {
    expect(
      findAssetProblems({
        declared: SEO_ASSETS.map((asset) => asset.path),
        existing,
        pending: PENDING_ASSETS,
      }),
    ).toEqual([])
  })

  it('checks uploaded images are PNGs with their declared dimensions', () => {
    for (const asset of SEO_ASSETS.filter((item) => existing.has(item.path))) {
      const size = readPngSize(readFileSync(join(PUBLIC_DIR, asset.path.slice(1))))

      expect(size, `${asset.path} is not a valid PNG`).not.toBeNull()
      expect(size, `${asset.path} should be ${asset.width}×${asset.height}`).toEqual({
        width: asset.width,
        height: asset.height,
      })
    }
  })
})

describe('manifest.webmanifest', () => {
  const manifest = JSON.parse(readFileSync(join(PUBLIC_DIR, 'manifest.webmanifest'), 'utf8')) as {
    name: string
    start_url: string
    display: string
    icons: Array<{ src: string; sizes: string; type: string }>
  }

  it('uses the site name and starts at the home page', () => {
    expect(manifest.name).toBe(SITE_NAME)
    expect(manifest.start_url).toBe('/')
    expect(manifest.display).toBe('standalone')
  })

  it('uses declared assets with matching dimensions for its icons', () => {
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2)

    for (const icon of manifest.icons) {
      const declared = SEO_ASSETS.find((asset) => asset.path === icon.src)

      expect(declared, `${icon.src} is not declared in SEO_ASSETS`).toBeDefined()
      expect(icon.sizes).toBe(`${declared?.width}x${declared?.height}`)
      expect(icon.type).toBe('image/png')
    }
  })
})
