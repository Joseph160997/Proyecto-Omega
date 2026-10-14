import { makeQuote } from '@/test-utils/makeQuote'

/** Datos pequeños con casos de borde: plano, sin volumen y sin ningún dato. */
export const SAMPLE_QUOTES = [
  makeQuote('btc', { marketCap: 1000, volume24h: 20, change24hPercent: 0.5 }),
  makeQuote('eth', { marketCap: 500, volume24h: 100, change24hPercent: 5 }),
  makeQuote('sol', { marketCap: 100, volume24h: 40, change24hPercent: -4 }),
  makeQuote('ada', { marketCap: 50, change24hPercent: 0.004 }), // se ve 0.00%: plano; sin volumen
  makeQuote('xrp', { marketCap: 200, volume24h: 10, change24hPercent: -1 }),
  makeQuote('new'), // sin ningún dato
]
