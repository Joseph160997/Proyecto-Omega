import { renderRobots, renderSitemap } from './src/seo/crawlers.ts'
import { renderHeadTags } from './src/seo/headTags.ts'
import { normalizeSiteUrl } from './src/seo/site.ts'

import type { Plugin } from 'vite'

const HEAD_MARKER = '<!-- seo:head -->'

/**
 * Inyecta las etiquetas de SEO en index.html y genera robots.txt y sitemap.xml al compilar.
 * `rawSiteUrl` es el dominio canónico del sitio; sin él no se emiten URLs absolutas ni sitemap.
 */
export function seoPlugin(rawSiteUrl: string | undefined): Plugin {
  const siteUrl = normalizeSiteUrl(rawSiteUrl)

  return {
    name: 'omega-seo',

    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replace(HEAD_MARKER, renderHeadTags({ siteUrl })),
    },

    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: renderRobots(siteUrl) })

      if (siteUrl !== undefined) {
        this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: renderSitemap(siteUrl) })
      }
    },
  }
}
