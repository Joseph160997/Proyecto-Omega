import { HOME_TITLE, SITE_DESCRIPTION, SITE_NAME } from './site.ts'

export interface PageMeta {
  readonly title: string
  readonly description: string
  /** false → la página lleva `noindex` (privada, sin contenido propio o inexistente). */
  readonly indexable: boolean
}

const PAGES: ReadonlyMap<string, PageMeta> = new Map<string, PageMeta>([
  ['/', { title: HOME_TITLE, description: SITE_DESCRIPTION, indexable: true }],
  [
    '/markets',
    {
      title: `Mercados · ${SITE_NAME}`,
      description:
        'Top 250 criptomonedas por capitalización: precio, cambio en 24 horas, volumen y tendencia de 7 días. Datos de CoinGecko.',
      indexable: true,
    },
  ],
  [
    '/portfolio',
    {
      title: `Portafolio · ${SITE_NAME}`,
      description: 'Tu portafolio virtual: posiciones, ganancias y pérdidas con dinero ficticio.',
      indexable: false,
    },
  ],
  [
    '/watchlist',
    {
      title: `Watchlist · ${SITE_NAME}`,
      description: 'Tus activos favoritos para seguirlos de un vistazo.',
      indexable: false,
    },
  ],
  [
    '/alerts',
    {
      title: `Alertas · ${SITE_NAME}`,
      description: 'Alertas de precio y de movimientos del mercado.',
      indexable: false,
    },
  ],
  [
    '/history',
    {
      title: `Historial · ${SITE_NAME}`,
      description: 'Historial de tus compras y ventas simuladas.',
      indexable: false,
    },
  ],
  [
    '/settings',
    {
      title: `Ajustes · ${SITE_NAME}`,
      description: 'Preferencias visuales y de simulación.',
      indexable: false,
    },
  ],
])

const NOT_FOUND: PageMeta = {
  title: `Página no encontrada · ${SITE_NAME}`,
  description: 'La página que buscas no existe.',
  indexable: false,
}

const ASSET_DETAIL: PageMeta = {
  title: `Detalle de activo · ${SITE_NAME}`,
  description: 'Precio, gráfico histórico y operación simulada de un activo.',
  indexable: false,
}

/** Minúsculas y sin barras finales: "/Markets/" y "/markets" son la misma página. */
export function normalizePath(pathname: string): string {
  const path = pathname.toLowerCase().replace(/\/+$/, '')

  return path === '' ? '/' : path
}

export function metaForPath(pathname: string): PageMeta {
  const path = normalizePath(pathname)

  if (/^\/markets\/[^/]+$/.test(path)) return ASSET_DETAIL

  return PAGES.get(path) ?? NOT_FOUND
}

/** Ruta canónica de una página indexable; undefined para el resto (no se canonicalizan). */
export function canonicalPathFor(pathname: string): string | undefined {
  const path = normalizePath(pathname)

  return PAGES.get(path)?.indexable ? path : undefined
}

/** Rutas que entran en el sitemap. */
export const INDEXABLE_PATHS: readonly string[] = [...PAGES]
  .filter(([, meta]) => meta.indexable)
  .map(([path]) => path)
