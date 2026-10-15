import {
  HOME_TITLE,
  OG_IMAGE,
  OG_IMAGE_ALT,
  SEO_ASSETS,
  SITE_DESCRIPTION,
  SITE_LANGUAGE,
  SITE_LOCALE,
  SITE_NAME,
} from './site.ts'

const escapeAttribute = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

const meta = (attribute: 'name' | 'property', key: string, content: string) =>
  `<meta ${attribute}="${key}" content="${escapeAttribute(content)}" />`

/**
 * Etiquetas estáticas de <head>, iguales para TODAS las rutas: los rastreadores de redes
 * sociales no ejecutan JavaScript, así que ven exactamente esto. Por eso aquí no hay
 * canonical ni og:url (dirían que todas las páginas son la portada).
 * Con `siteUrl` se añaden las etiquetas que exigen URLs absolutas (imagen social, JSON-LD).
 */
export function renderHeadTags({ siteUrl }: { siteUrl: string | undefined }): string {
  const image = siteUrl === undefined ? undefined : `${siteUrl}${OG_IMAGE.path}`
  const appleIcon = SEO_ASSETS.find((asset) => asset.path === '/apple-touch-icon.png')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    inLanguage: SITE_LANGUAGE,
    isAccessibleForFree: true,
    ...(siteUrl === undefined ? {} : { url: siteUrl }),
    ...(image === undefined ? {} : { image }),
  }

  const lines = [
    `<title>${escapeAttribute(HOME_TITLE)}</title>`,
    meta('name', 'description', SITE_DESCRIPTION),
    ...(appleIcon ? [`<link rel="apple-touch-icon" href="${appleIcon.path}" />`] : []),
    '<link rel="manifest" href="/manifest.webmanifest" />',
    // Conexión anticipada a lo que la app va a pedir nada más cargar.
    '<link rel="preconnect" href="https://api.coingecko.com" crossorigin />',
    '<link rel="preconnect" href="https://coin-images.coingecko.com" />',
    meta('property', 'og:type', 'website'),
    meta('property', 'og:site_name', SITE_NAME),
    meta('property', 'og:title', HOME_TITLE),
    meta('property', 'og:description', SITE_DESCRIPTION),
    meta('property', 'og:locale', SITE_LOCALE),
    ...(image === undefined
      ? []
      : [
          meta('property', 'og:image', image),
          meta('property', 'og:image:width', String(OG_IMAGE.width)),
          meta('property', 'og:image:height', String(OG_IMAGE.height)),
          meta('property', 'og:image:alt', OG_IMAGE_ALT),
        ]),
    meta('name', 'twitter:card', image === undefined ? 'summary' : 'summary_large_image'),
    meta('name', 'twitter:title', HOME_TITLE),
    meta('name', 'twitter:description', SITE_DESCRIPTION),
    ...(image === undefined
      ? []
      : [meta('name', 'twitter:image', image), meta('name', 'twitter:image:alt', OG_IMAGE_ALT)]),
    // `<` escapado: ningún valor puede cerrar el <script> antes de tiempo.
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replaceAll('<', '\\u003c')}</script>`,
  ]

  return lines.join('\n    ')
}
