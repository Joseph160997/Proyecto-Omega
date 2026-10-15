import { INDEXABLE_PATHS } from './routeMeta.ts'

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

/** robots.txt: todo permitido (lo privado se marca con noindex dentro de cada página). */
export function renderRobots(siteUrl: string | undefined): string {
  const lines = ['User-agent: *', 'Allow: /']

  if (siteUrl !== undefined) lines.push('', `Sitemap: ${siteUrl}/sitemap.xml`)

  return `${lines.join('\n')}\n`
}

/** sitemap.xml con las páginas indexables. Sin `lastmod`: no se inventan fechas. */
export function renderSitemap(siteUrl: string, paths: readonly string[] = INDEXABLE_PATHS): string {
  const entries = paths
    .map((path) => `  <url>\n    <loc>${escapeXml(`${siteUrl}${path}`)}</loc>\n  </url>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`
}
