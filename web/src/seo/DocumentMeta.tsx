import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { applyDocumentMeta } from '@/seo/applyDocumentMeta'
import { canonicalPathFor, metaForPath } from '@/seo/routeMeta'
import { SITE_URL } from '@/seo/site'

interface DocumentMetaProps {
  /** Permite desactivar la URL del sitio en pruebas. */
  siteUrl?: string | null
}

/** No dibuja nada: mantiene sincronizado el <head> con la ruta actual. */
export function DocumentMeta({ siteUrl = SITE_URL }: DocumentMetaProps) {
  const { pathname } = useLocation()

  useEffect(() => {
    const canonicalPath = canonicalPathFor(pathname)

    applyDocumentMeta(document, {
      meta: metaForPath(pathname),
      canonicalHref:
        siteUrl !== undefined && siteUrl !== null && canonicalPath !== undefined
          ? `${siteUrl}${canonicalPath}`
          : undefined,
    })
  }, [pathname, siteUrl])

  return null
}
