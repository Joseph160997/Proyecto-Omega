// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

import { applyDocumentMeta } from './applyDocumentMeta.ts'

import type { PageMeta } from './routeMeta.ts'

const PUBLIC: PageMeta = {
  title: 'Markets · X',
  description: 'Public description',
  indexable: true,
}
const PRIVATE: PageMeta = {
  title: 'Portfolio · X',
  description: 'Private description',
  indexable: false,
}

/** Creates an isolated document for each test. */
const newDocument = (head = '') => {
  const doc = document.implementation.createHTMLDocument('initial')

  doc.head.innerHTML = head

  return doc
}

const robots = (doc: Document) =>
  doc.head.querySelector('meta[name="robots"]')?.getAttribute('content')
const canonical = (doc: Document) =>
  doc.head.querySelector('link[rel="canonical"]')?.getAttribute('href')

describe('applyDocumentMeta', () => {
  it('updates the document title', () => {
    const doc = newDocument()

    applyDocumentMeta(doc, { meta: PUBLIC, canonicalHref: undefined })

    expect(doc.title).toBe('Markets · X')
  })

  it('updates an existing description instead of duplicating it', () => {
    const doc = newDocument('<meta name="description" content="old" />')

    applyDocumentMeta(doc, { meta: PUBLIC, canonicalHref: undefined })

    expect(doc.head.querySelectorAll('meta[name="description"]')).toHaveLength(1)
    expect(doc.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Public description',
    )
  })

  it('creates a description when one does not exist', () => {
    const doc = newDocument()

    applyDocumentMeta(doc, { meta: PUBLIC, canonicalHref: undefined })

    expect(doc.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Public description',
    )
  })

  it('sets noindex for private pages and removes robots for public pages', () => {
    const doc = newDocument()

    applyDocumentMeta(doc, { meta: PRIVATE, canonicalHref: undefined })
    expect(robots(doc)).toBe('noindex')

    applyDocumentMeta(doc, { meta: PUBLIC, canonicalHref: undefined })
    expect(robots(doc)).toBeUndefined()
  })

  it('adds canonical only for indexable pages and removes it for private pages', () => {
    const doc = newDocument()

    applyDocumentMeta(doc, { meta: PUBLIC, canonicalHref: 'https://x.example/markets' })
    expect(canonical(doc)).toBe('https://x.example/markets')

    applyDocumentMeta(doc, { meta: PRIVATE, canonicalHref: 'https://x.example/portfolio' })
    expect(canonical(doc)).toBeUndefined()
  })

  it('omits canonical when the site URL is unavailable', () => {
    const doc = newDocument()

    applyDocumentMeta(doc, { meta: PUBLIC, canonicalHref: undefined })

    expect(canonical(doc)).toBeUndefined()
  })

  it('is idempotent and does not accumulate tags', () => {
    const doc = newDocument()

    for (let index = 0; index < 3; index += 1) {
      applyDocumentMeta(doc, { meta: PRIVATE, canonicalHref: undefined })
      applyDocumentMeta(doc, { meta: PUBLIC, canonicalHref: 'https://x.example/markets' })
    }

    expect(doc.head.querySelectorAll('meta[name="description"]')).toHaveLength(1)
    expect(doc.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1)
    expect(doc.head.querySelectorAll('meta[name="robots"]')).toHaveLength(0)
  })
})
