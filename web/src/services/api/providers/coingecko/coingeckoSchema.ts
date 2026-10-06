import { z } from 'zod'

/**
 * Solo declaramos lo que usamos. Zod ignora el resto, así que si CoinGecko
 * añade campos, nada se rompe.
 */
export const CoinGeckoMarketItemSchema = z.object({
  id: z.string().min(1),
  symbol: z.string().min(1),
  name: z.string().min(1),
  current_price: z.number().nullable(),
  market_cap: z.number().nullable().optional(),
  total_volume: z.number().nullable().optional(),
  price_change_percentage_24h: z.number().nullable().optional(),
  // Forma ISO obligatoria: Date.parse es demasiado permisivo (acepta "1" como fecha).
  last_updated: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
})

/** Para identificar un elemento aunque el resto de sus campos sea inválido. */
export const CoinGeckoItemIdentitySchema = z.object({ id: z.string().min(1) })
