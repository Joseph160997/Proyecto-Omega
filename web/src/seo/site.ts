// Datos del sitio. Sin imports de la app: este archivo también lo usa vite.config (Node).

export const SITE_NAME = 'Omega Markets'
export const SITE_URL = 'https://proyecto-omega-sigma.vercel.app'
export const SITE_TAGLINE = 'Terminal financiera simulada'
export const HOME_TITLE = `${SITE_NAME} · ${SITE_TAGLINE}`
export const SITE_DESCRIPTION =
  'Mercados reales, portafolio virtual y dinero ficticio. Un proyecto educativo para aprender cómo se mueven los mercados sin arriesgar dinero real.'
export const SITE_LANGUAGE = 'es'
export const SITE_LOCALE = 'es_LA'

export interface SeoAsset {
  readonly path: string
  readonly width: number
  readonly height: number
  readonly purpose: string
}

export const OG_IMAGE: SeoAsset = {
  path: '/og-image.png',
  width: 1200,
  height: 630,
  purpose: 'Vista previa al compartir el enlace',
}

export const OG_IMAGE_ALT = 'Omega Markets: terminal financiera simulada'

/** Todas las imágenes de public/ que el SEO y el manifiesto referencian. */
export const SEO_ASSETS: readonly SeoAsset[] = [
  OG_IMAGE,
  {
    path: '/apple-touch-icon.png',
    width: 180,
    height: 180,
    purpose: 'Icono en la pantalla de inicio de iOS',
  },
  { path: '/icon-192.png', width: 192, height: 192, purpose: 'Icono de la aplicación (Android)' },
  { path: '/icon-512.png', width: 512, height: 512, purpose: 'Icono grande de la aplicación' },
  {
    path: '/icon-maskable-512.png',
    width: 512,
    height: 512,
    purpose: 'Icono adaptable (con margen de seguridad)',
  },
]

/**
 * Convierte la URL pública del sitio en su origen ("https://dominio.com"), o undefined si no
 * es una URL http(s) válida. Sin URL de sitio no se emiten etiquetas con URLs absolutas.
 */
export function normalizeSiteUrl(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined

  const trimmed = raw.trim()

  if (trimmed === '') return undefined

  try {
    const url = new URL(trimmed)

    return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : undefined
  } catch {
    return undefined
  }
}
