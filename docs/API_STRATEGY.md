# Omega Markets — API Strategy

> Estrategia técnica para consumo de APIs financieras. Este documento define proveedores, normalización, cache, rate limits, fallbacks y esquema de recuperación ante errores.

**Estado:** Draft inicial  
**Versión:** 0.1.0  
**Relacionado con:** [ARCHITECTURE.md](ARCHITECTURE.md), [DATA_MODEL.md](DATA_MODEL.md), [AI_STRATEGY.md](AI_STRATEGY.md), [BLUEPRINT.md](BLUEPRINT.md)

---

## 1. Objetivo

Omega Markets consume varias fuentes de datos. Este documento define:

- qué providers se usarán
- cómo transformarlos a contratos internos
- cómo se manejan límites y fallos
- qué hacer en modo demo/offline
- cómo dejar preparada una capa proxy futura

---

## 2. Principios

1. **Ninguna API es confiable por defecto.**
2. **Siempre validar y normalizar.**
3. **Hacer fallback por cadena.**
4. **No exponer errores de red como errores de dominio.**
5. **Cachear con políticas claras.**
6. **Preparar proxy sin romper las interfaces.**

---

## 3. Proveedores recomendados

### Crypto

```txt
Primary: CoinGecko
Secondary: Binance
Fallback: Demo provider
```

### Stocks

```txt
Primary: Finnhub
Secondary: Twelve Data
Fallback: Demo / cache
```

### Forex

```txt
Primary: Frankfurter
Secondary: Twelve Data
Fallback: Demo
```

### Indices

```txt
Primary: Finnhub / Twelve Data
Secondary: Demo
```

### Commodities

```txt
Primary: Demo provider
Secondary: proveedor futuro
```

---

## 4. Interface de provider

Cada provider implementa esta interfaz:

```ts
interface MarketDataProvider {
  getQuotes(assetIds: string[]): Promise<Quote[]>;
  getCandles(assetId: string, range: TimeRange): Promise<Candle[]>;
  search(query: string): Promise<Asset[]>;
}
```

La UI nunca debe depender del formato crudo de un provider; debe recibir contratos normalizados del dominio.

---

## 5. Normalización

El flujo recomendado es:

```txt
raw API response
  ↓
Zod parsing
  ↓
adapter mapping
  ↓
domain model (Quote, Candle, Asset)
```

Ejemplo:

```ts
function mapCoinGeckoToQuote(raw: unknown): Quote {
  const dto = CoinGeckoMarketSchema.parse(raw);

  return {
    assetId: `crypto:${dto.symbol.toLowerCase()}`,
    symbol: dto.symbol.toUpperCase(),
    name: dto.name,
    type: "crypto",
    price: dto.current_price,
    change24h: dto.price_change_percentage_24h ?? undefined,
    volume: dto.total_volume ?? undefined,
    marketCap: dto.market_cap ?? undefined,
    currency: "USD",
    timestamp: Date.now(),
    source: "coingecko",
    stale: false,
  };
}
```

---

## 6. Fallback chain

### Crypto

```txt
CoinGecko
  ↓ falla
Binance
  ↓ falla
Demo provider
```

### Stocks

```txt
Finnhub
  ↓ falla
Twelve Data
  ↓ falla
Cache / Demo
```

### Regla de diseño

El fallback debe activarse de forma transparente para la UI, pero ser observable en logs y deterioro de estado.

---

## 7. Cache

### Cache de server state

Se recomienda TanStack Query para:

- quotes
- candles
- search
- market overview

Ejemplo de política:

```ts
staleTime: 60_000;
cacheTime: 5 * 60_000;
refetchOnWindowFocus: false;
```

### Cache persistida local

Para offline o degraded mode se puede guardar:

- últimas quotes
- candles recientes
- results de búsqueda

Nunca cargar desde storage sin validar con Zod.

### TTL sugerido

| Tipo           | TTL sugerido |
| -------------- | -----------: |
| Crypto quotes  |      30–60 s |
| Crypto candles |     5–15 min |
| Stock quotes   |        5 min |
| Forex          |       1 hora |
| Search         |        5 min |

---

## 8. Rate limiting

Los providers gratuitos tienen restricciones severas. La estrategia debe ser defensiva:

- no polling agresivo
- debounce en búsquedas
- deduplicación de requests
- cache en múltiples capas
- refresh manual o controlado
- mostrar estado stale cuando la data ya no es fresca

---

## 9. Timeouts y retries

### Timeout

```ts
const DEFAULT_TIMEOUT_MS = 8000;
```

Usar `AbortController` para cancelar petición si tarda demasiado.

### Retry

Retry solo para:

- network error
- timeout
- 5xx

No retry para:

- 4xx
- validación inválida
- rate limit sin backoff seguro

Backoff sugerido:

```txt
500ms → 1000ms → 2000ms
```

---

## 10. Manejo de errores

### Código de error recomendado

```ts
type ApiErrorCode =
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "RATE_LIMIT"
  | "INVALID_RESPONSE"
  | "PROVIDER_UNAVAILABLE"
  | "UNSUPPORTED_ASSET";
```

### Fases separadas

```txt
request
  ↓
validation / parsing
  ↓
mapping to domain
  ↓
cache / persistence
```

Importante: si la data válida llega y la cache falla, la app no debe descartar la respuesta. La cache es un efecto secundario, no la verdad primaria.

---

## 11. Variables de entorno

### Ejemplo de `.env.example`

```env
VITE_COINGECKO_BASE_URL=https://api.coingecko.com/api/v3
VITE_BINANCE_BASE_URL=https://api.binance.com/api/v3
VITE_FINNHUB_BASE_URL=https://finnhub.io/api/v1
VITE_FINNHUB_API_KEY=
VITE_TWELVEDATA_BASE_URL=https://api.twelvedata.com
VITE_TWELVEDATA_API_KEY=
VITE_FRANKFURTER_BASE_URL=https://api.frankfurter.app
```

### Validación de env

```ts
const EnvSchema = z.object({
  VITE_COINGECKO_BASE_URL: z.string().url(),
  VITE_BINANCE_BASE_URL: z.string().url(),
  VITE_FINNHUB_BASE_URL: z.string().url().optional(),
  VITE_FINNHUB_API_KEY: z.string().optional(),
  VITE_TWELVEDATA_BASE_URL: z.string().url().optional(),
  VITE_TWELVEDATA_API_KEY: z.string().optional(),
  VITE_FRANKFURTER_BASE_URL: z.string().url(),
});
```

> Las claves `VITE_*` son visibles en frontend. Deben usarse solo para acceso público o bajo riesgo.

---

## 12. CORS y proxy futuro

### Estado actual

Algunas APIs permiten CORS directo; otras pueden requerir proxy.

### Proxy opcional

Un backend o proxy serverless puede:

- ocultar keys
- normalizar payloads
- reforzar cache
- reducir CORS problemas
- aplicar rate limiting server-side

Esta arquitectura ya está preparada para un cambio de proveedor: el adaptador cambia, pero la UI no debe conocer la diferencia.

---

## 13. Demo provider

El modo demo está pensado para:

- desarrollo local
- fallback cuando la API cae
- pruebas de estado vacíos, stale y error
- UI con apariencia realista sin depender de internet

Debe presentarse explícitamente como `Demo mode` para no engañar al usuario.

---

## 14. Provider health

Se recomienda mantener un estado interno por proveedor:

```ts
interface ProviderHealth {
  name: ProviderName;
  status: "healthy" | "degraded" | "down";
  lastError?: string;
  cooldownUntil?: number;
}
```

Esto permite:

- detectar caídas repetidas
- impedir spamming en cooldown
- mostrar estado del sistema en UI futura

---

## 15. Testing de APIs

### Recomendado

- MSW para simular respuestas
- test de fallback por provider
- test de validación inválida
- test de timeout y rate limit
- test de `stale` detection

---

## 16. Roadmap de integración

### Fase 1

- env validation
- api client base
- demo provider

### Fase 2

- CoinGecko
- market table

### Fase 3

- Binance + candles
- asset detail chart

### Fase 4

- Frankfurter
- forex básico

### Fase 5

- Finnhub / Twelve Data
- stocks y search multi-asset

### Fase 6

- provider health
- rate limiting mejorado
- circuit breaker
- proxy opcional

---

## 17. Conclusión

La estrategia de APIs de Omega Markets debe ser defensiva:

```txt
validar
normalizar
cachear
limitar
fallback
informar
```

La app no debe depender ciegamente de una fuente externa. Debe degradar elegante y claro cuando falla una API, manteniendo la UX útil y segura.
