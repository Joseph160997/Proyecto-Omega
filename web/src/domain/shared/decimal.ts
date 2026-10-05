import Decimal from 'decimal.js'

/**
 * Único archivo del proyecto que importa `decimal.js`.
 * Clon aislado: no modificamos la configuración global de la librería.
 */
export const D = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
})

export const ROUND_HALF_UP = Decimal.ROUND_HALF_UP

export type Dec = Decimal
