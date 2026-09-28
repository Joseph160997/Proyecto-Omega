# Omega Markets — Blueprint

> Documento maestro de producto, arquitectura y principios para Omega Markets.
> Este archivo define qué estamos construyendo, por qué, cómo debe crecer y qué decisiones fundamentales guían el proyecto.

**Estado:** Draft inicial  
**Versión:** 0.1.0  
**Última actualización:** 2026  
**Proyecto base:** Reescritura profesional del Proyecto Omega hacia una terminal financiera moderna en React + TypeScript.

---

## 1. Resumen ejecutivo

**Omega Markets** es una terminal financiera moderna, simulada, accesible e inteligente donde el usuario puede observar mercados, analizar activos, operar virtualmente, gestionar riesgo y recibir insights mediante una capa de IA.

No es solo un dashboard de precios. Es un **workspace financiero interactivo**.

Omega Markets permite:

- Ver mercados en vivo: crypto, acciones, índices, divisas y materias primas.
- Buscar, filtrar y comparar activos.
- Ver gráficos históricos e intradía.
- Construir un portafolio virtual.
- Comprar y vender activos de forma simulada.
- Registrar operaciones.
- Analizar ganancias, pérdidas y rendimiento.
- Crear watchlists y alertas.
- Recibir insights automáticos.
- Interactuar con una capa de IA basada en herramientas y datos reales de la app.

Todo el sistema se construye con foco en:

- Validación estricta de datos.
- Seguridad desde el inicio.
- Accesibilidad.
- Escalabilidad modular.
- Documentación de trade-offs.
- Experiencia de usuario profesional.
- Simulación sin dinero real.

---

## 2. Visión del producto

Convertir Omega Markets en una plataforma que se sienta como:

> “Una terminal financiera elegante, educativa e interactiva donde cualquier usuario puede observar mercados, simular decisiones y entender mejor el impacto de sus movimientos.”

Omega Markets no busca ser:

- Un broker real.
- Una plataforma de trading con dinero real.
- Un sistema de asesoría financiera profesional.
- Una red social financiera.
- Un sistema de señales de inversión.

Omega Markets busca ser:

- Un simulador profesional.
- Un laboratorio de análisis.
- Una terminal educativa.
- Un workspace interactivo.
- Una base sólida para evolucionar hacia features más avanzadas.

---

## 3. Propuesta de valor

Omega Markets combina cuatro capacidades principales:

### 3.1 Observación

El usuario puede ver el estado del mercado en tiempo casi real, con datos provenientes de múltiples APIs gratuitas.

### 3.2 Análisis

El usuario puede comparar activos, ver gráficos, filtrar mercados, revisar movimientos y entender riesgos.

### 3.3 Simulación

El usuario puede comprar y vender activos virtualmente, gestionando cash, posiciones, órdenes, historial y P&L.

### 3.4 Inteligencia

El sistema puede generar insights automáticos y conectar una capa de IA con herramientas reales de la aplicación.

---

## 4. Usuarios objetivo

### Usuario principal

- Persona interesada en mercados financieros.
- Quiere aprender sin arriesgar dinero real.
- Le interesa ver datos, gráficos y portafolio.
- Busca una interfaz moderna, clara y profesional.

### Usuario secundario

- Desarrollador que quiere un proyecto frontend serio.
- Persona interesada en arquitectura, APIs, validación, IA y buenas prácticas.
- Usuario que valora accesibilidad, testing y escalabilidad.

### Usuario futuro

- Usuario avanzado que quiere terminal mode, layouts personalizables, journal de trading y análisis de riesgo.
- Usuario que quiere IA contextual para entender su portafolio y movimientos de mercado.

---

## 5. Principios fundamentales

### 5.1 Validar todo lo que entra

Toda respuesta externa debe pasar por validación runtime.

Fuentes externas:

- APIs financieras.
- LocalStorage / IndexedDB.
- Parámetros de URL.
- Formularios.
- Respuestas de IA.
- Eventos externos.

Herramienta principal:

- Zod.

### 5.2 Validar todo lo que se guarda

Antes de persistir datos, deben validarse contra schemas versionados.

Esto aplica para:

- Portfolio.
- Watchlist.
- Alerts.
- Notifications.
- Journal.
- Settings.
- Layouts.
- Snapshots.
- Historial de operaciones.

### 5.3 Validar todo lo que sale

Cuando la app envíe datos a:

- IA.
- Analytics futura.
- Exportaciones.
- Event bus.
- Servicios externos.

Debe hacerlo mediante contratos validados.

### 5.4 Seguridad desde el inicio

Omega Markets debe asumir que:

- Las APIs pueden fallar.
- Las APIs pueden devolver datos corruptos.
- El storage puede estar corrupto.
- Las claves de frontend son visibles.
- El usuario puede introducir inputs inválidos.
- La IA puede responder de forma incorrecta.

Por tanto:

- No se confía ciegamente en ninguna fuente.
- Se sanitiza y valida datos.
- Se evita `dangerouslySetInnerHTML`.
- Se aplican timeouts y rate limits.
- Se cachea de forma inteligente.
- Se documenta qué claves son públicas.
- Se prepara arquitectura para proxy opcional.

### 5.5 Accesibilidad real

La app debe ser usable:

- Con teclado.
- Con lectores de pantalla.
- Con contraste suficiente.
- Con estados de carga claros.
- Con errores comprensibles.
- Con animaciones respetuosas con `prefers-reduced-motion`.

### 5.6 Escalabilidad sin sobreingeniería

El proyecto debe crecer por módulos.

No se debe construir todo al inicio, pero la arquitectura debe permitirlo.

### 5.7 Simulación primero

Omega Markets no maneja dinero real.

Toda operación es simulada.

Esto permite:

- Experimentar.
- Aprender.
- Probar estrategias.
- Deshacer errores.
- Mostrar advertencias educativas.

---

## 6. Alcance inicial

## 6.1 Dentro del alcance inicial

- React + TypeScript.
- Vite.
- ESLint.
- Prettier.
- Husky.
- Zod.
- TanStack Query.
- Zustand.
- React Router.
- Tailwind CSS.
- Dark/light mode.
- Validación runtime.
- Consumo de APIs gratuitas.
- Normalización de activos.
- Fallback de providers.
- Cache.
- Persistencia local.
- Portfolio virtual.
- Compra/venta simulada.
- Watchlist.
- Buscador.
- Filtros.
- Gráficos.
- Asset detail.
- Command palette.
- Alertas básicas.
- Notifications center.
- Daily briefing básico.
- AI Copilot inicial con herramientas.

## 6.2 Fuera del alcance inicial

- Dinero real.
- Broker real.
- Órdenes avanzadas completas.
- Backend obligatorio.
- Autenticación real.
- Social trading.
- Backtesting complejo.
- Machine learning pesado.
- Recomendaciones financieras vinculantes.
- Ejecución automática de IA sin confirmación.
- Soporte completo de commodities si no hay API gratuita estable.

---

## 7. Concepto visual

Omega Markets debe sentirse como una terminal financiera moderna, pero elegante y accesible.

No debe parecer:

- Un dashboard genérico.
- Una página de curso básica.
- Una app saturada de colores.
- Una terminal caótica.

Debe parecer:

- Una fintech premium.
- Una terminal limpia.
- Un producto cuidado.
- Un workspace profesional.

---

## 8. Modos visuales

### Dark mode

Concepto:

```txt
Terminal financiera elegante
```

Características:

- Fondos grafito profundos.
- Paneles translúcidos sutiles.
- Bordes finos.
- Glow suave en acentos.
- Números en fuente mono.
- Verde/rojo semánticos.
- Alto contraste para datos importantes.

### Light mode

Concepto:

```txt
Fintech limpia
```

Características:

- Fondos claros.
- Menos glow.
- Mayor legibilidad.
- Acentos sobrios.
- Sensación institucional.

---

## 9. Módulos principales

Omega Markets se divide en módulos funcionales.

```txt
Omega Markets
├── Dashboard
├── Markets
├── Asset Detail
├── Portfolio
├── Trading
├── Watchlist
├── Alerts
├── Notifications
├── History
├── Journal
├── Risk Center
├── Research / AI Copilot
├── Settings
└── Future Modules
```

---

## 10. Core interactivo inicial

Este es el núcleo de la primera versión seria del producto.

### 10.1 Multi-vista con React Router

La app no debe ser una sola vista estática.

Debe tener rutas principales:

```txt
/
/markets
/asset/:assetId
/portfolio
/watchlist
/alerts
/history
/settings
```

### 10.2 Portfolio virtual

El usuario puede:

- Configurar saldo inicial.
- Comprar activos.
- Vender activos.
- Ver posiciones.
- Ver cash disponible.
- Ver P&L.
- Ver historial.

### 10.3 Watchlist avanzada

El usuario puede:

- Agregar activos.
- Quitar activos.
- Ver watchlist rápidamente.
- Acceder a detalle de activo.
- Crear alertas desde watchlist.
- Ver mini gráficos.

Futuro:

- Carpetas.
- Tags.
- Notas.
- Drag & drop.
- Smart watchlists.

### 10.4 Buscador global + filtros

El usuario puede buscar:

- Activos.
- Páginas.
- Acciones.
- Alertas.
- Configuraciones.

Ejemplos:

```txt
BTC
Portfolio
Risk
Alerts
Buy BTC
Create alert ETH
```

### 10.5 Command palette

Atajo:

```txt
Ctrl + K / Cmd + K
```

Acciones:

- Buscar activo.
- Abrir página.
- Comprar activo.
- Vender activo.
- Crear alerta.
- Cambiar tema.
- Analizar portafolio.
- Abrir configuración.

### 10.6 Alerts de precio

El usuario puede crear alertas como:

```txt
BTC > 100000
ETH < 2500
Portfolio daily loss > 3%
Asset change 24h > 10%
```

Futuro:

- Alertas por volumen.
- Alertas por volatilidad.
- Alertas por concentración.
- Alertas por drawdown.

### 10.7 Notification center

Centro de eventos:

```txt
Alert triggered
Order filled
Risk warning
Daily briefing ready
Provider fallback
Data stale
```

### 10.8 Asset detail con gráfico y quick trade

Cada activo debe tener una página con:

- Precio.
- Cambio 24h.
- Volumen.
- Market cap si aplica.
- Gráfico histórico.
- Selector de timeframe.
- Panel de compra.
- Panel de venta.
- Botón de alerta.
- Botón de watchlist.
- Insights contextuales.

### 10.9 Daily briefing / insights automáticos

Resumen generado a partir de datos:

```txt
Portfolio total: $12,450
Daily change: +1.2%
Top contributor: BTC
Worst performer: ETH
Crypto exposure: 64%
Risk flag: High concentration
```

### 10.10 AI Copilot con acciones reales

La IA no debe ser un simple chat genérico.

Debe poder usar tools:

```ts
getPortfolioSummary();
getAssetQuote(assetId);
getTopMovers();
getTopLosers();
getAllocation();
getRiskFlags();
getDailyBriefing();
simulateOrder(side, assetId, quantity);
createAlert(assetId, condition);
compareAssets(assetIds);
explainConcept(term);
```

La IA debe:

- Responder con datos reales.
- Validar respuestas.
- No ejecutar acciones destructivas sin confirmación.
- Mostrar preview antes de operar.
- Ser útil aunque no haya LLM externo.

---

## 11. Rutas principales

```txt
/                          Dashboard
/markets                   Mercado global
/markets?type=crypto       Mercado filtrado
/asset/:assetId            Detalle de activo
/portfolio                 Portafolio
/portfolio/history         Historial
/watchlist                 Watchlist
/alerts                    Alertas
/notifications             Notificaciones
/settings                  Configuración
/ai                        AI Copilot
```

Rutas futuras:

```txt
/compare
/risk
/journal
/research
/terminal
/settings/layout
/settings/data
/challenges
```

---

## 12. Arquitectura general

Omega Markets usa arquitectura por capas y módulos.

```txt
┌─────────────────────────────────────────────┐
│                  UI Layer                   │
│ Dashboard, Markets, Portfolio, Alerts, AI   │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│              Application Layer              │
│ Hooks, Use Cases, Stores, Command Handlers  │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│                Domain Layer                 │
│ Portfolio, Orders, Quotes, PnL, Risk        │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│              Infrastructure Layer           │
│ API adapters, Storage, AI, Analytics        │
└─────────────────────────────────────────────┘
```

---

## 13. Capas del sistema

### 13.1 UI Layer

Responsable de:

- Renderizar vistas.
- Manejar interacciones.
- Mostrar estados.
- Mantener accesibilidad.
- Conectar con hooks y stores.

No debe:

- Calcular reglas complejas de negocio.
- Llamar APIs directamente.
- Conocer detalles de providers.
- Persistir datos directamente.

### 13.2 Application Layer

Responsable de:

- Casos de uso.
- Hooks.
- Orquestación.
- Stores.
- Validación de inputs de usuario.
- Coordinación entre dominio e infraestructura.

Ejemplos:

```ts
useMarketQuotes();
useAssetDetail();
usePortfolio();
useOrderPreview();
useWatchlist();
useAlerts();
useAiCopilot();
```

### 13.3 Domain Layer

Responsable de:

- Entidades.
- Reglas financieras.
- Cálculos de P&L.
- Validaciones de órdenes.
- Riesgo.
- Asignación.
- Insights determinísticos.

No depende de:

- React.
- TanStack Query.
- IndexedDB.
- APIs externas.

### 13.4 Infrastructure Layer

Responsable de:

- APIs externas.
- Storage.
- Adapters.
- IA externa.
- Exportaciones.
- Logging.
- Analytics futura.

---

## 14. Estructura de carpetas propuesta

```txt
src/
├── app/
│   ├── providers/
│   ├── router/
│   ├── App.tsx
│   └── bootstrap.ts
├── components/
│   ├── ui/
│   ├── charts/
│   ├── layout/
│   ├── feedback/
│   └── command/
├── features/
│   ├── dashboard/
│   ├── markets/
│   ├── asset-detail/
│   ├── portfolio/
│   ├── trading/
│   ├── watchlist/
│   ├── alerts/
│   ├── notifications/
│   ├── history/
│   ├── ai/
│   ├── risk/
│   └── settings/
├── domain/
│   ├── market/
│   ├── portfolio/
│   ├── orders/
│   ├── alerts/
│   ├── notifications/
│   ├── insights/
│   └── shared/
├── services/
│   ├── api/
│   │   ├── providers/
│   │   ├── adapters/
│   │   ├── schemas/
│   │   ├── client.ts
│   │   ├── fallback.ts
│   │   ├── rateLimiter.ts
│   │   └── deduplication.ts
│   ├── storage/
│   │   ├── repositories/
│   │   ├── schemas.ts
│   │   ├── migrations.ts
│   │   └── keys.ts
│   └── ai/
│       ├── router/
│       ├── tools/
│       ├── rag/
│       ├── schemas.ts
│       ├── localEngine.ts
│       └── llmAdapter.ts
├── hooks/
├── lib/
├── styles/
└── types/
```

---

## 15. Modelo de dominio

## 15.1 Asset

```ts
type AssetType = "crypto" | "stock" | "index" | "forex" | "commodity";

interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  currency: string;
  providers: ProviderMapping[];
}
```

Ejemplo de ID canónico:

```txt
crypto:btc
stock:aapl
index:sp500
forex:eurusd
commodity:gold
```

---

## 15.2 ProviderMapping

```ts
type ProviderName =
  | "coingecko"
  | "binance"
  | "finnhub"
  | "twelvedata"
  | "frankfurter"
  | "demo";

interface ProviderMapping {
  provider: ProviderName;
  symbol: string;
  metadata?: Record<string, unknown>;
}
```

---

## 15.3 Quote

```ts
interface Quote {
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

---

## 15.4 Candle

```ts
interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}
```

---

## 15.5 Position

```ts
interface Position {
  assetId: string;
  quantity: number;
  avgCost: number;
  updatedAt: number;
}
```

---

## 15.6 Order

```ts
type OrderSide = "buy" | "sell";

interface Order {
  id: string;
  assetId: string;
  side: OrderSide;
  quantity: number;
  price: number;
  fee?: number;
  status: "filled" | "rejected";
  reason?: string;
  createdAt: number;
}
```

---

## 15.7 Transaction

```ts
interface Transaction {
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

---

## 15.8 PortfolioSnapshot

```ts
interface PortfolioSnapshot {
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

## 15.9 Alert

```ts
type AlertCondition =
  | "price_above"
  | "price_below"
  | "change_24h_above"
  | "change_24h_below"
  | "portfolio_drop"
  | "portfolio_gain";

interface Alert {
  id: string;
  assetId?: string;
  condition: AlertCondition;
  value: number;
  status: "active" | "triggered" | "disabled";
  createdAt: number;
  triggeredAt?: number;
}
```

---

## 15.10 AppNotification

```ts
type NotificationType =
  | "alert_triggered"
  | "order_filled"
  | "order_rejected"
  | "risk_warning"
  | "daily_briefing_ready"
  | "provider_fallback"
  | "data_stale";

interface AppNotification {
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

## 16. Estrategia de APIs

Omega Markets debe soportar múltiples proveedores.

## 16.1 Proveedores recomendados

| Categoría   | Primary               | Secondary               | Fallback / Future        |
| ----------- | --------------------- | ----------------------- | ------------------------ |
| Crypto      | CoinGecko             | Binance                 | Demo provider            |
| Stocks      | Finnhub               | Twelve Data             | Alpha Vantage            |
| Indices     | Finnhub / Twelve Data | Demo provider           | Proxy futuro             |
| Forex       | Frankfurter           | Twelve Data             | Demo provider            |
| Commodities | Demo provider         | Twelve Data si hay plan | Proxy / proveedor futuro |

---

## 16.2 Filosofía de providers

Cada provider implementa una interfaz común.

```ts
interface MarketDataProvider {
  getQuotes(assetIds: string[]): Promise<Quote[]>;
  getCandles(assetId: string, range: TimeRange): Promise<Candle[]>;
  search(query: string): Promise<Asset[]>;
}
```

Esto permite cambiar proveedores sin romper la app.

---

## 16.3 Fallback chain

Ejemplo para crypto:

```txt
CoinGecko
   ↓ si falla
Binance
   ↓ si falla
Demo provider
```

Ejemplo para stocks:

```txt
Finnhub
   ↓ si falla
Twelve Data
   ↓ si falla
Cache / Demo provider
```

---

## 16.4 Rate limiting

Las APIs gratuitas tienen límites.

Por tanto:

- No hacer polling agresivo.
- Usar cache.
- Usar stale time.
- Hacer refresh manual o controlado.
- Encolar requests.
- Mostrar estado de datos stale.

---

## 16.5 Deduplicación

No repetir la misma request si:

- Ya hay una en vuelo.
- Ya existe cache válida.
- Varios componentes piden el mismo dato.

Se usará:

- TanStack Query.
- Query keys estables.
- Request deduplicator para casos específicos.

---

## 17. Normalización de activos

Cada API usa símbolos distintos.

Ejemplos:

```txt
CoinGecko: bitcoin
Binance: BTCUSDT
Finnhub: AAPL
Twelve Data: AAPL
Frankfurter: EURUSD
```

Omega Markets usa IDs canónicos:

```txt
crypto:btc
stock:aapl
forex:eurusd
index:sp500
commodity:gold
```

Esto permite:

- Watchlist estable.
- Portfolio estable.
- Historial consistente.
- Fallback entre providers.
- Deduplicación.
- Búsqueda global.

---

## 18. Validación con Zod

Zod se usa en todas las fronteras.

## 18.1 Validación de APIs

```ts
const CoinGeckoMarketSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  current_price: z.number(),
  image: z.string().url().optional(),
  market_cap: z.number().nullable().optional(),
  total_volume: z.number().nullable().optional(),
  price_change_percentage_24h: z.number().nullable().optional(),
});
```

---

## 18.2 Validación de storage

```ts
const StoredWatchlistSchema = z.object({
  version: z.literal(1),
  assetIds: z.array(z.string()),
  updatedAt: z.number(),
});
```

---

## 18.3 Validación de forms

```ts
const OrderFormSchema = z.object({
  assetId: z.string().min(1),
  side: z.enum(["buy", "sell"]),
  quantity: z.number().positive(),
});
```

---

## 18.4 Validación de AI output

```ts
const AiInsightSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  severity: z.enum(["info", "warning", "critical"]),
  actionable: z.boolean(),
  action: z.string().optional(),
});
```

---

## 19. Persistencia local

## 19.1 Qué se guarda

- Portfolio.
- Orders.
- Transactions.
- Watchlist.
- Alerts.
- Notifications.
- Settings.
- Journal futuro.
- Layouts futuros.
- Snapshots futuros.

## 19.2 Tecnología recomendada

Para MVP:

- IndexedDB mediante abstracción propia.
- Opción recomendada: Dexie si se requiere más potencia.

Alternativa simple:

- `idb-keyval`.

Decisión recomendada:

```txt
Crear StorageRepository independiente.
Empezar simple pero con capacidad de migrar a Dexie.
```

---

## 19.3 Reglas de storage

Toda lectura de storage debe validarse.

Toda escritura debe validarse.

Storage debe tener:

```txt
version
schema
migrations
fallback
```

---

## 20. Estado de la aplicación

## 20.1 Server state

Datos externos:

- Quotes.
- Candles.
- Search results.
- News futura.
- Provider health.

Herramienta:

- TanStack Query.

Responsabilidades:

- Cache.
- Retry.
- Stale time.
- Refetch.
- Loading states.
- Error states.

---

## 20.2 Client state

Datos locales de UI:

- Watchlist.
- Portfolio.
- Alerts.
- Notifications.
- Theme.
- Command palette.
- Settings.

Herramienta:

- Zustand.

---

## 20.3 URL state

Estado compartible por URL:

- Tipo de activo.
- Filtros.
- Búsqueda.
- Timeframe.
- Comparación futura.
- Página.

---

## 20.4 Form state

Herramienta:

- React Hook Form.
- Zod resolver.

---

## 21. Diseño y layout

## 21.1 Layout general

```txt
------------------------------------------------------------
| Topbar: logo | buscador | command palette | theme | bell |
------------------------------------------------------------
| Sidebar  | Main Content                         | Right  |
|          |                                      | Panel  |
| Dashboard| Dashboard / Markets / Asset Detail   | Watch  |
| Markets  | Portfolio / Settings                 | list   |
| Portfolio|                                      | AI     |
| Watchlist|                                      |        |
| Alerts   |                                      |        |
------------------------------------------------------------
```

---

## 21.2 Componentes base

```txt
Button
Input
Select
Card
Badge
Tabs
Table
Modal
Toast
Skeleton
Tooltip
EmptyState
ErrorState
Spinner
CommandPalette
NotificationCenter
```

---

## 21.3 Componentes financieros

```txt
QuoteCard
AssetTable
AssetRow
Sparkline
CandleChart
AllocationDonut
PnLBadge
OrderPreview
AlertForm
WatchlistPanel
RiskPanel
DailyBriefing
```

---

## 22. Accesibilidad

## 22.1 Requisitos mínimos

- Navegación completa por teclado.
- Focus visible.
- Labels correctos.
- ARIA donde sea necesario.
- Contraste AA.
- Errores comprensibles.
- Estados de carga anunciables.
- Tooltips accesibles.
- Modales accesibles.
- Command palette accesible.

---

## 22.2 Consideraciones especiales

- Los cambios de precio no deben depender solo del color.
- Las animaciones deben respetar `prefers-reduced-motion`.
- Los toasts no deben ser la única fuente de información crítica.
- Las tablas deben tener headers semánticos.
- Las alertas deben poder gestionarse por teclado.

---

## 23. Seguridad

## 23.1 Frontend-only

Omega Markets puede comenzar frontend-only.

Esto implica:

- Las API keys en `.env` son visibles para el usuario.
- Deben tratarse como claves públicas.
- No deben usarse para secretos reales.
- Se recomienda cache y rate limiting.

---

## 23.2 Proxy futuro

Se deja preparada la arquitectura para un proxy opcional.

Beneficios:

- Ocultar claves.
- Normalizar respuestas.
- Mejorar CORS.
- Aplicar cache server-side.
- Reducir rate limits desde cliente.

---

## 23.3 Reglas de seguridad

- No usar `dangerouslySetInnerHTML` salvo necesidad extrema y sanitización.
- Validar inputs.
- Validar respuestas externas.
- Sanitizar contenido generado por IA si se renderiza.
- No ejecutar acciones IA sin confirmación.
- No guardar secretos sensibles en storage.
- Versionar storage.
- Manejar errores sin exponer datos internos.
- Usar CSP cuando sea posible.

---

## 24. Capa de IA

## 24.1 Concepto

La IA debe ser una capa de asistencia contextual.

No debe ser:

- Un chatbot genérico.
- Un asesor financiero vinculante.
- Un sistema que ejecute acciones sin confirmación.

Debe ser:

- Un copiloto.
- Un generador de insights.
- Un conector de tools.
- Un explicador de contexto.

---

## 24.2 Arquitectura

```txt
User Input
   ↓
Intent Router
   ↓
Tool Selection
   ↓
Context Builder
   ↓
Local Engine / LLM Adapter
   ↓
Response Validation
   ↓
UI Action / Insight
```

---

## 24.3 Intents

```txt
portfolio_query
market_query
education_query
action_request
risk_analysis
briefing_request
```

---

## 24.4 Tools

```ts
getPortfolioSummary();
getAssetQuote(assetId);
getTopMovers();
getTopLosers();
getAllocation();
getRiskFlags();
getDailyBriefing();
simulateOrder(side, assetId, quantity);
createAlert(assetId, condition);
compareAssets(assetIds);
explainConcept(term);
```

---

## 24.5 RAG ligero

Base de conocimiento local sobre:

- Conceptos financieros.
- Métricas.
- Riesgo.
- Diversificación.
- Órdenes.
- Indicadores.
- Documentación de Omega Markets.

Primera versión:

- Búsqueda lexical simple.
- Sin embeddings pesados.

Futuro:

- Embeddings locales.
- RAG más avanzado.
- Memoria de conversaciones.

---

## 24.6 Guardrails

La IA:

- No debe inventar precios.
- No debe ejecutar trades automáticamente.
- No debe dar asesoría financiera profesional.
- Debe indicar cuando no tiene datos.
- Debe validar respuestas con Zod.
- Debe mostrar fuente de datos cuando sea relevante.

---

## 25. Testing

## 25.1 Unit tests

Para:

- Mappers/adapters.
- Cálculos de P&L.
- Validaciones de órdenes.
- Risk calculations.
- Zod schemas.
- Storage migrations.
- Insights determinísticos.

---

## 25.2 Integration tests

Para:

- Hooks con MSW.
- Fallback providers.
- Portfolio flow.
- Watchlist persistence.
- Alerts evaluation.
- Command palette actions.

---

## 25.3 E2E futuro

Para:

- Flujo de compra.
- Flujo de venta.
- Crear alerta.
- Buscar activo.
- Cambiar tema.
- Abrir command palette.
- Ver portfolio actualizado.

---

## 26. Observabilidad

Omega Markets debe mostrar estados claros.

## 26.1 Estados de datos

```txt
loading
success
error
stale
fallback
demo
```

---

## 26.2 Eventos importantes

```txt
provider_failed
provider_fallback
cache_served
storage_validation_failed
order_filled
order_rejected
alert_triggered
ai_tool_executed
```

---

## 26.3 Logs

Durante desarrollo:

- Logs estructurados.
- Niveles: info, warn, error.
- Contexto por módulo.

Producción:

- No exponer datos sensibles.
- No loggear claves.
- No loggear payloads completos si contienen datos privados.

---

## 27. Performance

## 27.1 Reglas

- Code splitting por rutas.
- Lazy loading de vistas pesadas.
- Memoización selectiva.
- Virtualización de tablas grandes.
- Cache agresivo para quotes.
- Evitar polling innecesario.
- Optimizar charts.
- Reducir animaciones costosas.

---

## 27.2 Métricas

- First Contentful Paint.
- Largest Contentful Paint.
- Time to Interactive.
- Bundle size.
- Request count.
- Cache hit rate.
- Provider latency.

---

## 28. Trade-offs fundamentales

## 28.1 Frontend-only vs proxy

Decisión inicial:

```txt
Frontend-only para MVP.
```

Trade-off:

- Más simple y rápido.
- Claves visibles.
- Menos control de CORS.
- Arquitectura preparada para proxy.

---

## 28.2 TanStack Query vs fetch manual

Decisión:

```txt
TanStack Query.
```

Trade-off:

- Más dependencia.
- Mejor cache, retry, estados y escalabilidad.

---

## 28.3 Zustand vs Redux Toolkit

Decisión:

```txt
Zustand.
```

Trade-off:

- Menos estructura impuesta.
- Menos boilerplate.
- Suficiente para el scope.

---

## 28.4 Dexie vs idb-keyval

Decisión:

```txt
Abstracción propia.
Empezar simple.
Considerar Dexie si crece.
```

Trade-off:

- Simpleza inicial.
- Posible migración futura.

---

## 28.5 Recharts vs lightweight-charts

Decisión:

```txt
Usar ambos según contexto.
```

- Recharts para analytics.
- lightweight-charts para velas.

---

## 29. Herencia del Proyecto Omega

El Proyecto Omega original deja aprendizajes importantes.

## 29.1 Patrones a conservar

### DTO → Mapper → Domain

Original:

```txt
API DTO → Mapper → Domain Model
```

Omega Markets:

```txt
API raw → Zod schema → Adapter → Domain Model
```

---

### Fetch con cache

Original:

```txt
fetchWithCache
```

Omega Markets:

```txt
TanStack Query + api client + fallback + storage repository
```

---

### Storage service

Original:

```txt
IndexedDB wrapper
```

Omega Markets:

```txt
StorageRepository con schemas versionados
```

---

### PubSub

Original:

```txt
EventBus
```

Omega Markets:

```txt
Eventos selectivos para alerts, notifications y trading events
```

---

### Theme service

Original:

```txt
Theme persistence
```

Omega Markets:

```txt
ThemeProvider + tokens + settings persistidos
```

---

### Cart

Original:

```txt
Cart preview / add / remove
```

Omega Markets:

```txt
Order preview / confirm / transaction
```

---

## 29.2 Errores del pasado que debemos evitar

Basado en `docs/FIXES.md` del proyecto original:

- No perder contexto `this` en mappers/callbacks.
- No mezclar error de red con error de mapeo.
- No descartar datos válidos por error de storage.
- No depender de variables de entorno sin validar.
- No mostrar mensajes de error ambiguos.
- No pintar UI antes de inicializar estado crítico.
- No confiar en storage sin validación.

---

## 30. Métricas de éxito del producto

## 30.1 Producto

- El usuario puede cargar mercado sin errores.
- El usuario puede comprar/vender simuladamente.
- El usuario entiende su P&L.
- El usuario puede crear alertas.
- El usuario puede usar command palette.
- El usuario puede recibir insights útiles.

---

## 30.2 Técnico

- Build pasa.
- Tests pasan.
- Lint pasa.
- Typecheck pasa.
- No hay errores críticos en runtime.
- Storage se recupera si está corrupto.
- APIs tienen fallback.
- Zod rechaza datos inválidos.
- Accesibilidad básica pasa.

---

## 31. Glosario

### Asset

Instrumento financiero: crypto, acción, índice, divisa o commodity.

### Quote

Precio y datos básicos de un activo en un momento dado.

### Candle

Vela financiera con open, high, low, close y volumen.

### Position

Cantidad de un activo dentro del portafolio.

### Order

Instrucción simulada de compra o venta.

### Transaction

Registro ejecutado de una orden.

### P&L

Profit and Loss: ganancia o pérdida.

### Realized P&L

Ganancia o pérdida materializada tras una venta.

### Unrealized P&L

Ganancia o pérdida potencial de posiciones abiertas.

### Allocation

Distribución del portafolio por activo o categoría.

### Risk flag

Advertencia de riesgo detectada por el sistema.

### Stale data

Datos que ya no son suficientemente recientes.

### Provider

Fuente externa de datos de mercado.

### Fallback

Proveedor alternativo cuando el principal falla.

---

## 32. Conclusión

Omega Markets debe construirse como una plataforma modular, profesional y escalable.

La primera versión debe enfocarse en:

1. Base técnica sólida.
2. Datos validados y confiables.
3. UI elegante y accesible.
4. Portfolio simulado.
5. Interactividad real.
6. Insights automáticos.
7. IA contextual con herramientas.

Las features avanzadas quedan documentadas en el roadmap para crecer sin perder dirección.
