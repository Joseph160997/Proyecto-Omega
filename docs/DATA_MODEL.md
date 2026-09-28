# Omega Markets — Data Model

> Modelo canónico de dominio y persistencia para Omega Markets. Este documento define entidades, invariantes y contratos que deben ser fuente única para reglas de negocio, storage y validación.

**Estado:** Draft inicial  
**Versión:** 0.1.0  
**Relacionado con:** [ARCHITECTURE.md](ARCHITECTURE.md), [API_STRATEGY.md](API_STRATEGY.md), [AI_STRATEGY.md](AI_STRATEGY.md), [BLUEPRINT.md](BLUEPRINT.md)

---

## 1. Objetivo

Este documento centraliza:

- activos y tipos
- quotes y candles
- órdenes, posiciones, transacciones y snapshots
- alertas y notificaciones
- settings y watchlist
- validaciones Zod sobre inputs y persistence

No repite definiciones de providers, cache ni IA; esos pertenecen a sus fuentes canónicas.

---

## 2. Principios del modelo

1. **Dibujar el dominio sin depender del navegador.**
2. **Normalizar IDs y nombres.**
3. **Validar en las fronteras.**
4. **Versionar todo lo persistido.**
5. **Mantener invariantes explícitas.**

---

## 3. Identificadores canónicos

```txt
{type}:{symbol}
```

Ejemplos:

```txt
crypto:btc
crypto:eth
stock:aapl
forex:eurusd
index:sp500
commodity:gold
```

Esto permite:

- deduplicación estable
- watchlist consistente
- portfolio consistente
- almacenamiento sin ambigüedad

---

## 4. Tipos base

### AssetType

```ts
export type AssetType = "crypto" | "stock" | "index" | "forex" | "commodity";
```

### ProviderName

```ts
export type ProviderName =
  | "coingecko"
  | "binance"
  | "finnhub"
  | "twelvedata"
  | "frankfurter"
  | "alphavantage"
  | "demo";
```

### OrderSide

```ts
export type OrderSide = "buy" | "sell";
```

### OrderStatus

```ts
export type OrderStatus = "filled" | "rejected";
```

### AlertCondition

```ts
export type AlertCondition =
  | "price_above"
  | "price_below"
  | "change_24h_above"
  | "change_24h_below"
  | "portfolio_drop"
  | "portfolio_gain";
```

### AlertStatus

```ts
export type AlertStatus = "active" | "triggered" | "disabled";
```

### ThemeMode

```ts
export type ThemeMode = "dark" | "light";
```

---

## 5. Asset y providers

```ts
export interface ProviderMapping {
  provider: ProviderName;
  symbol: string;
  metadata?: Record<string, unknown>;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  currency: string;
  providers: ProviderMapping[];
}
```

Ejemplo:

```json
{
  "id": "crypto:btc",
  "symbol": "BTC",
  "name": "Bitcoin",
  "type": "crypto",
  "currency": "USD",
  "providers": [
    { "provider": "coingecko", "symbol": "bitcoin" },
    { "provider": "binance", "symbol": "BTCUSDT" }
  ]
}
```

---

## 6. Quote

```ts
export interface Quote {
  assetId: string;
  symbol: string;
  name: string;
  type: AssetType;
  price: number;
  change24h?: number;
  volume?: number;
  marketCap?: number;
  currency: string;
  timestamp: number;
  source: ProviderName;
  stale: boolean;
}
```

Invariantes recomendadas:

- `price >= 0`
- `symbol` no vacío
- `timestamp` válido
- `source` debe pertenecer a `ProviderName`

---

## 7. Candle

```ts
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}
```

Invariantes:

- `high >= low`
- `high >= open`
- `high >= close`
- `low <= open`
- `low <= close`

---

## 8. Portfolio settings

```ts
export interface PortfolioSettings {
  initialCash: number;
  baseCurrency: string;
  feePercent: number;
  slippageMode: "off" | "low" | "medium";
  updatedAt: number;
}
```

Default sugerido:

```json
{
  "initialCash": 10000,
  "baseCurrency": "USD",
  "feePercent": 0.1,
  "slippageMode": "off",
  "updatedAt": 0
}
```

---

## 9. Position

```ts
export interface Position {
  assetId: string;
  quantity: number;
  avgCost: number;
  updatedAt: number;
}
```

Invariantes:

- `quantity >= 0`
- `avgCost >= 0`
- `assetId` debe existir en el dominio

---

## 10. Order

```ts
export interface Order {
  id: string;
  assetId: string;
  side: OrderSide;
  quantity: number;
  price: number;
  fee?: number;
  status: OrderStatus;
  reason?: string;
  createdAt: number;
}
```

Invariantes:

- `quantity > 0`
- `price > 0`
- `side` válido
- `status` válido

---

## 11. Transaction

```ts
export interface Transaction {
  id: string;
  orderId: string;
  assetId: string;
  side: OrderSide;
  quantity: number;
  price: number;
  total: number;
  fee?: number;
  createdAt: number;
}
```

Regla de cálculo:

```ts
const total = quantity * price + (fee ?? 0); // buy
const total = quantity * price - (fee ?? 0); // sell
```

---

## 12. PortfolioSnapshot

```ts
export interface PortfolioSnapshot {
  cash: number;
  totalValue: number;
  positionsValue: number;
  unrealizedPnl: number;
  realizedPnl: number;
  dayChange?: number;
  timestamp: number;
}
```

---

## 13. Alert

```ts
export interface Alert {
  id: string;
  assetId?: string;
  condition: AlertCondition;
  value: number;
  status: AlertStatus;
  createdAt: number;
  triggeredAt?: number;
}
```

Reglas:

- si la condición es de precio o cambio por activo, `assetId` es obligatorio
- `value` debe ser numérico válido
- `status` debe ser uno de los permitidos

---

## 14. Notification

```ts
export type NotificationType =
  | "alert_triggered"
  | "order_filled"
  | "order_rejected"
  | "risk_warning"
  | "daily_briefing_ready"
  | "provider_fallback"
  | "data_stale";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
  metadata?: Record<string, unknown>;
}
```

---

## 15. Insight

```ts
export type InsightSeverity = "info" | "warning" | "critical";

export interface Insight {
  id: string;
  title: string;
  message: string;
  severity: InsightSeverity;
  actionable: boolean;
  action?: string;
  createdAt: number;
}
```

Ejemplo:

```json
{
  "id": "insight:concentration:btc",
  "title": "Alta concentración en BTC",
  "message": "El 52% de tu portafolio está en BTC.",
  "severity": "warning",
  "actionable": true,
  "action": "view-risk",
  "createdAt": 1730000000000
}
```

---

## 16. Watchlist y settings

```ts
export interface WatchlistState {
  assetIds: string[];
  updatedAt: number;
}

export interface AppSettings {
  theme: ThemeMode;
  reducedMotion: boolean;
  soundEnabled: boolean;
  aiEnabled: boolean;
  demoMode: boolean;
  updatedAt: number;
}
```

---

## 17. Storage keys recomendados

```ts
export const STORAGE_KEYS = {
  portfolio: "omega-markets:portfolio:v1",
  orders: "omega-markets:orders:v1",
  transactions: "omega-markets:transactions:v1",
  watchlist: "omega-markets:watchlist:v1",
  alerts: "omega-markets:alerts:v1",
  notifications: "omega-markets:notifications:v1",
  settings: "omega-markets:settings:v1",
  snapshots: "omega-markets:snapshots:v1",
} as const;
```

---

## 18. Versionado de storage

Todo valor persistido debe tener `version` y ser validado con Zod al leer/escribir.

```ts
export const StoredWatchlistSchema = z.object({
  version: z.literal(1),
  assetIds: z.array(z.string()),
  updatedAt: z.number(),
});
```

La política de storage es:

- leer con schema
- si falla, intentar migración
- si falla igualmente, usar default seguro
- registrar warning sin romper UI

---

## 19. Zod: ejemplos canónicos

### AssetSchema

```ts
export const AssetSchema = z.object({
  id: z.string().min(1),
  symbol: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["crypto", "stock", "index", "forex", "commodity"]),
  currency: z.string().min(3).max(10),
  providers: z.array(
    z.object({
      provider: z.enum([
        "coingecko",
        "binance",
        "finnhub",
        "twelvedata",
        "frankfurter",
        "alphavantage",
        "demo",
      ]),
      symbol: z.string().min(1),
      metadata: z.record(z.unknown()).optional(),
    }),
  ),
});
```

### QuoteSchema

```ts
export const QuoteSchema = z.object({
  assetId: z.string().min(1),
  symbol: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["crypto", "stock", "index", "forex", "commodity"]),
  price: z.number().nonnegative(),
  change24h: z.number().optional(),
  volume: z.number().nonnegative().optional(),
  marketCap: z.number().nonnegative().optional(),
  currency: z.string().min(3).max(10),
  timestamp: z.number(),
  source: z.enum([
    "coingecko",
    "binance",
    "finnhub",
    "twelvedata",
    "frankfurter",
    "alphavantage",
    "demo",
  ]),
  stale: z.boolean(),
});
```

### OrderSchema

```ts
export const OrderSchema = z.object({
  id: z.string().uuid(),
  assetId: z.string().min(1),
  side: z.enum(["buy", "sell"]),
  quantity: z.number().positive(),
  price: z.number().positive(),
  fee: z.number().nonnegative().optional(),
  status: z.enum(["filled", "rejected"]),
  reason: z.string().optional(),
  createdAt: z.number(),
});
```

---

## 20. Cálculos de dominio

### Position value

```ts
positionValue = quantity * currentPrice;
```

### Unrealized PnL

```ts
unrealizedPnl = (currentPrice - avgCost) * quantity;
```

### Allocation

```ts
allocationPercent = (positionValue / totalPortfolioValue) * 100;
```

### Realized PnL

```ts
realizedPnl = (sellPrice - avgCost) * soldQuantity - fees;
```

---

## 21. Reglas principales de negocio

### Compra

Debe validarse que:

- `assetId` exista
- `quantity > 0`
- `price > 0`
- `cash >= totalCompra`
- la quote no esté stale si la UI exige freshness

### Venta

Debe validarse que:

- `assetId` exista
- `quantity > 0`
- `price > 0`
- la posición es suficiente para cubrir la venta

### Alertas

Debe validarse que:

- la condición es válida
- el valor es numérico
- `assetId` existe para alertas de activo

---

## 22. Datos stale

Un quote debe considerarse stale cuando:

```ts
Date.now() - quote.timestamp > staleThresholdMs;
```

Ejemplo sugerido:

- crypto: 60 segundos
- stocks: 5 minutos
- forex: 5 minutos
- demo: configurable

---

## 23. Extensibilidad

Campos futuros esperables:

```ts
sector?: string;
tags?: string[];
imageUrl?: string;
```

```ts
openedAt?: number;
notes?: string;
```

```ts
type?: "market" | "limit" | "stop";
expiresAt?: number;
```

---

## 24. Conclusión

El modelo de datos de Omega Markets debe ser:

- tipado
- validado
- versionado
- normalizado
- recuperable
- mantenible
- independiente de APIs externas

Cualquier feature nueva debe extender este contrato y nunca crear un subconjunto paralelo de “tipos de UI” que no correspondan al dominio real.
