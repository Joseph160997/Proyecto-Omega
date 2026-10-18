export interface TradingPolicy {
  /** Comisión en puntos básicos (10 = 0.1 %). */
  readonly feeBps: number
  /** Antigüedad máxima de un precio para poder operar con él. */
  readonly maxQuoteAgeMs: number
}

/**
 * CoinGecko (plan gratuito) publica precios con 1–2 min de retraso y la app los refresca
 * cada 2 min: un precio "normal" tiene hasta ~4 min. Con 5 min las compras normales pasan y
 * un precio de verdad estancado (la API cayó, la pestaña estuvo dormida) se rechaza.
 *
 * Es un solo número a propósito: cuando lleguen acciones o divisas (horario de mercado) se
 * convertirá en una función por tipo de activo. No se inventa ahora lo que no se puede probar.
 */
export const DEFAULT_TRADING_POLICY: TradingPolicy = {
  feeBps: 10,
  maxQuoteAgeMs: 5 * 60_000,
}
