export interface PageView<T> {
  items: T[]
  /** Página efectiva: ya corregida si la pedida estaba fuera de rango. */
  page: number
  totalPages: number
  totalItems: number
  /** Posición (desde 1) del primer y último elemento mostrado; 0 y 0 si no hay elementos. */
  from: number
  to: number
}

export type PageItem = number | 'gap'

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index)

export function totalPagesFor(totalItems: number, pageSize: number): number {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new RangeError(`pageSize inválido: ${String(pageSize)}`)
  }

  if (!Number.isInteger(totalItems) || totalItems < 0) {
    throw new RangeError(`totalItems inválido: ${String(totalItems)}`)
  }

  // Sin elementos sigue habiendo una página (vacía): evita "página 1 de 0".
  return Math.max(1, Math.ceil(totalItems / pageSize))
}

/** Lleva cualquier valor a una página válida. Lo que no es finito (NaN, Infinity) cae a 1. */
export function clampPage(page: number, totalPages: number): number {
  if (!Number.isFinite(page)) return 1

  return Math.min(Math.max(Math.trunc(page), 1), totalPages)
}

export function paginate<T>(items: readonly T[], page: number, pageSize: number): PageView<T> {
  const totalItems = items.length
  const totalPages = totalPagesFor(totalItems, pageSize)
  const current = clampPage(page, totalPages)
  const start = (current - 1) * pageSize
  const slice = items.slice(start, start + pageSize)

  return {
    items: slice,
    page: current,
    totalPages,
    totalItems,
    from: totalItems === 0 ? 0 : start + 1,
    to: start + slice.length,
  }
}

/**
 * Qué botones mostrar: 1 … 4 5 6 … 13. Con más de 7 páginas la ventana tiene
 * siempre 7 posiciones, para que la barra no "baile" al cambiar de página.
 */
export function pageWindow(current: number, total: number, siblings = 1): PageItem[] {
  if (!Number.isInteger(siblings) || siblings < 0) {
    throw new RangeError(`siblings inválido: ${String(siblings)}`)
  }

  if (!Number.isInteger(total) || total < 1) return []

  if (total <= 2 * siblings + 5) return range(1, total)

  const page = clampPage(current, total)
  const edge = 2 * siblings + 3 // páginas seguidas cuando estás cerca de un borde

  if (page <= edge - siblings) return [...range(1, edge), 'gap', total]
  if (page >= total - edge + 1 + siblings) return [1, 'gap', ...range(total - edge + 1, total)]

  return [1, 'gap', ...range(page - siblings, page + siblings), 'gap', total]
}
