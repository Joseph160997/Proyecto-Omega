import type { PageMeta } from './routeMeta.ts'

interface DocumentMetaInput {
  meta: PageMeta
  /** URL canónica absoluta, o undefined para no tener canonical. */
  canonicalHref: string | undefined
}

/** Actualiza (o crea) una etiqueta de <head>; con `value` undefined, la quita. */
function setHeadTag(
  doc: Document,
  selector: string,
  create: () => HTMLElement,
  attribute: string,
  value: string | undefined,
) {
  const existing = doc.head.querySelector(selector)

  if (value === undefined) {
    existing?.remove()
    return
  }

  const element = existing ?? doc.head.appendChild(create())

  element.setAttribute(attribute, value)
}

/**
 * Aplica título, descripción, robots y canonical de la página actual.
 * Es idempotente: llamarla varias veces no duplica etiquetas.
 */
export function applyDocumentMeta(doc: Document, { meta, canonicalHref }: DocumentMetaInput): void {
  doc.title = meta.title

  const metaTag = (name: string) => () => {
    const element = doc.createElement('meta')

    element.setAttribute('name', name)

    return element
  }

  setHeadTag(doc, 'meta[name="description"]', metaTag('description'), 'content', meta.description)
  setHeadTag(
    doc,
    'meta[name="robots"]',
    metaTag('robots'),
    'content',
    meta.indexable ? undefined : 'noindex',
  )
  setHeadTag(
    doc,
    'link[rel="canonical"]',
    () => {
      const element = doc.createElement('link')

      element.setAttribute('rel', 'canonical')

      return element
    },
    'href',
    meta.indexable ? canonicalHref : undefined,
  )
}
