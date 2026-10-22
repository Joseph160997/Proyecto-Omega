import { describe, expect, it } from 'vitest'

import { navItems } from '../components/layout/nav-items'
import { canonicalPathFor, INDEXABLE_PATHS, metaForPath, normalizePath } from './routeMeta.ts'

const NOT_FOUND_TITLE = metaForPath('/this-route-does-not-exist').title

describe('normalizePath', () => {
  it.each([
    ['/', '/'],
    ['', '/'],
    ['///', '/'],
    ['/markets', '/markets'],
    ['/markets/', '/markets'],
    ['/Markets/', '/markets'],
    ['/Markets//', '/markets'],
  ])('normalizes %s to %s', (path, expected) => {
    expect(normalizePath(path)).toBe(expected)
  })
})

describe('metaForPath', () => {
  it('provides metadata for every navigation item', () => {
    navItems.forEach((item) => {
      expect(metaForPath(item.to).title).not.toBe(NOT_FOUND_TITLE)
    })
  })

  it('uses unique titles that fit within search result limits', () => {
    const titles = [...navItems.map((item) => metaForPath(item.to).title), NOT_FOUND_TITLE]

    expect(new Set(titles).size).toBe(titles.length)
    titles.forEach((title) => expect(title.length).toBeLessThanOrEqual(60))
  })

  it('provides non-empty descriptions within search result limits', () => {
    navItems.forEach((item) => {
      const { description } = metaForPath(item.to)

      expect(description.length).toBeGreaterThan(20)
      expect(description.length).toBeLessThanOrEqual(160)
    })
  })

  it('ignores trailing slashes and capitalization', () => {
    expect(metaForPath('/Markets/')).toBe(metaForPath('/markets'))
  })

  it('uses non-indexable asset detail metadata for one dynamic segment', () => {
    expect(metaForPath('/markets/crypto%3Abitcoin')).toEqual({
      title: 'Detalle de activo · Omega Markets',
      description: 'Precio, gráfico histórico y operación simulada de un activo.',
      indexable: false,
    })
    expect(metaForPath('/markets/crypto%3Abitcoin').indexable).toBe(false)
    expect(metaForPath('/markets/crypto%3Abitcoin/nested').title).toBe(NOT_FOUND_TITLE)
    expect(canonicalPathFor('/markets/crypto%3Abitcoin')).toBeUndefined()
  })

  it('marks unknown paths as not found and non-indexable', () => {
    expect(metaForPath('/nothing').indexable).toBe(false)
    expect(metaForPath('/nothing').title).toContain('no encontrada')
  })

  it.each([['/__proto__'], ['/constructor'], ['/toString']])(
    '%s is not treated as a known page',
    (path) => {
      expect(metaForPath(path).title).toBe(NOT_FOUND_TITLE)
    },
  )

  it('indexes only the home and markets pages', () => {
    const indexable = navItems
      .filter((item) => metaForPath(item.to).indexable)
      .map((item) => item.to)

    expect(indexable).toEqual(['/', '/markets'])
  })
})

describe('canonicalPathFor', () => {
  it('returns a clean canonical path for indexable pages', () => {
    expect(canonicalPathFor('/markets/')).toBe('/markets')
    expect(canonicalPathFor('/')).toBe('/')
  })

  it('omits canonical paths for private and unknown pages', () => {
    expect(canonicalPathFor('/portfolio')).toBeUndefined()
    expect(canonicalPathFor('/nothing')).toBeUndefined()
  })
})

describe('INDEXABLE_PATHS', () => {
  it('contains exactly the indexable routes', () => {
    expect(INDEXABLE_PATHS).toEqual(['/', '/markets'])
  })
})
