# Guía de diagnóstico, correcciones y estudio — Proyecto Omega

Documento de referencia para entender **qué fallaba**, **cómo se corrigió** y **qué archivos/funciones estudiar** para dominar la solución a fondo.

---

## Tabla de contenidos

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Errores detectados](#2-errores-detectados)
3. [Correcciones aplicadas](#3-correcciones-aplicadas)
4. [Archivos nuevos y modificados](#4-archivos-nuevos-y-modificados)
5. [Funciones clave para estudiar](#5-funciones-clave-para-estudiar)
6. [Flujo de datos de la app](#6-flujo-de-datos-de-la-app)
7. [Modo offline (PWA vs IndexedDB)](#7-modo-offline-pwa-vs-indexeddb)
8. [Cómo verificar que todo funciona](#8-cómo-verificar-que-todo-funciona)
9. [Referencia rápida de errores en consola](#9-referencia-rápida-de-errores-en-consola)

---

## 1. Resumen ejecutivo

**Síntoma inicial:** al ejecutar `npm run dev`, las tres vistas (Market, Inventory, Kanban) mostraban mensajes de error y ninguna API cargaba datos.

**Causa principal final (la que bloqueaba todo):** los Mappers perdían el contexto `this` al pasarse como callback a `fetchWithCache`, provocando `TypeError: Cannot read properties of undefined (reading 'toDomain')`.

**Estado actual:** la app carga datos correctamente en las tres vistas. Build y 18 tests pasan.

---

## 2. Errores detectados

### Tabla resumen

| #   | Error                                | Síntoma visible                                      | Archivo(s) afectado(s)        | Gravedad    |
| --- | ------------------------------------ | ---------------------------------------------------- | ----------------------------- | ----------- |
| E1  | Variables `.env` ausentes            | URLs = `undefined&per_page=10`                       | `src/services/*.ts`           | Alta        |
| E2  | Headers `Authorization` incorrectos  | Posibles rechazos HTTP en APIs públicas              | `src/services/*.ts`           | Media       |
| E3  | `fetchWithCache` con un solo `catch` | Datos válidos descartados si fallaba IndexedDB       | `src/utils/fetchWithCache.ts` | Alta        |
| E4  | Arranque desincronizado              | Parpadeo de tema; DOM antes de `themeService.init()` | `src/main.ts`                 | Media       |
| E5  | Pérdida de `this` en Mappers         | `TypeError: reading 'toDomain'` en consola           | `src/mappers/*.ts`            | **Crítica** |
| E6  | Mensaje engañoso "Red falló..."      | Confundía diagnóstico cuando el fetch sí funcionaba  | `src/utils/fetchWithCache.ts` | Media       |
| E7  | Typo HTML en Layout                  | Atributos HTML pegados sin espacio                   | `src/ui/Layout.ts`            | Baja        |
| E8  | Pestaña Market sin resaltar          | Nav sin indicador visual al cargar                   | `src/main.ts`                 | Baja        |
| E9  | README desactualizado                | Decía `localStorage`; código usa IndexedDB           | `README.md`                   | Baja        |

---

### E1 — Variables de entorno ausentes

**Qué pasaba:**

```typescript
const url = `${import.meta.env.VITE_API_COINGECKO}&per_page=10`;
// Sin .env → url = "undefined&per_page=10"
```

**Por qué ocurría:** `.env` está en `.gitignore` (correcto), pero no existía `.env.example` ni validación al arrancar.

**Mensaje en pantalla:** _"Market connection lost"_, _"Failed to link with Inventory API"_, _"Operations board offline"_ — los tres a la vez.

---

### E2 — Headers `Authorization` incorrectos

**Qué pasaba:**

```typescript
Authorization: `Bearer ${API_KEY}`;
// API_KEY contenía la URL completa, no una clave:
// "Bearer https://fakestoreapi.com/products"
```

**Por qué ocurría:** la variable se llamaba `API_KEY` pero guardaba la URL del endpoint. CoinGecko, Fake Store y JSONPlaceholder son APIs públicas sin autenticación.

---

### E3 — `fetchWithCache` descartaba datos válidos

**Qué pasaba:**

```
fetch() → ✅ datos recibidos
storage.save() → ❌ IndexedDB falla
catch general → intenta caché → vacía → ❌ lanza error
```

**Resultado:** error en pantalla aunque la API hubiera respondido bien.

---

### E4 — Arranque desincronizado en `main.ts`

**Qué pasaba:**

```typescript
(async () => {
  await themeService.init();
})(); // paralelo
app.innerHTML = renderLayout(); // inmediato, no espera
loadMarket(); // inmediato, no espera
```

**Resultado:** el comentario decía "evitar parpadeo blanco", pero el DOM se pintaba antes de recuperar el tema de IndexedDB.

---

### E5 — Pérdida de contexto `this` en Mappers _(error crítico final)_

**Síntoma exacto en consola:**

```
TypeError: Cannot read properties of undefined (reading 'toDomain')
    at crypto.mapper.ts:35
    at fetchWithCache (fetchWithCache.ts:26)
    at async loadMarket (main.ts:23)
```

**Qué pasaba:**

```typescript
// El servicio pasa el método como referencia:
fetchWithCache(url, "omega_crypto", CryptoMapper.toDomainList, options);

// Dentro del mapper (ANTES de la corrección):
static toDomainList(dtoList) {
  return dtoList.map((dto) => this.toDomain(dto));
  //                              ↑ `this` = undefined cuando se llama como callback
}
```

**Concepto clave para estudiar:** en JavaScript, cuando extraes un método de una clase y lo pasas como función suelta (`const fn = Clase.metodo`), pierde su contexto `this`. Los métodos estáticos deben referenciarse por nombre de clase: `CryptoMapper.toDomain(dto)`.

---

### E6 — Mensaje engañoso "Red falló..."

**Qué pasaba:** el `catch` de `fetchWithCache` capturaba **cualquier** error (red, mapeo, JSON inválido) y mostraba:

```
[Omega] Red falló para "omega_crypto", buscando caché local...
```

**Realidad:** el fetch había funcionado; el error era del mapper (E5).

---

### E7, E8, E9 — Errores menores

- **E7:** `id="content-view"class=` → atributos HTML sin espacio.
- **E8:** al cargar la app, la vista Market se mostraba pero la pestaña no quedaba resaltada.
- **E9:** README decía `localStorage`; el código usa IndexedDB vía `src/services/storage.ts`.

---

## 3. Correcciones aplicadas

### Tabla resumen

| Error | Corrección                                                 | Archivo(s)                          |
| ----- | ---------------------------------------------------------- | ----------------------------------- |
| E1    | `.env.example` + validación con `requireEnv()`             | `.env.example`, `src/config/env.ts` |
| E2    | Eliminado header `Authorization`; URLs en `env.*`          | `src/services/*.ts`                 |
| E3    | `storage.save()` en su propio `try/catch`                  | `src/utils/fetchWithCache.ts`       |
| E4    | Función `bootstrap()` unificada con `await`                | `src/main.ts`                       |
| E5    | `this.toDomain` → `CryptoMapper.toDomain` (y equivalentes) | `src/mappers/*.ts`                  |
| E6    | Tres fases separadas: red / mapeo / guardado               | `src/utils/fetchWithCache.ts`       |
| E7    | Espacio añadido entre atributos HTML                       | `src/ui/Layout.ts`                  |
| E8    | `updateActiveTab(marketTab)` al iniciar                    | `src/main.ts`                       |
| E9    | README reescrito con instrucciones de `.env`               | `README.md`                         |

---

### Corrección E1 — Configuración de entorno centralizada

**Antes:** cada servicio leía `import.meta.env.VITE_API_*` directamente, sin validar.

**Después:** módulo `src/config/env.ts` valida al importar:

```typescript
function requireEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `[Omega] Falta la variable "${name}". Copia .env.example a .env...`,
    );
  }
  return value;
}

export const env = {
  apiCoingecko: requireEnv("VITE_API_COINGECKO"),
  apiFakestore: requireEnv("VITE_API_FAKESTORE"),
  apiTasks: requireEnv("VITE_API_TASKS"),
} as const;
```

Si falta `.env`, la app muestra pantalla de error vía `renderBootError()` en lugar de fallar silenciosamente en cada módulo.

---

### Corrección E5 — Mappers seguros como callback

**Antes (roto):**

```typescript
return dtoList.map((dto) => this.toDomain(dto));
```

**Después (funciona siempre, incluso como callback):**

```typescript
return dtoList.map((dto) => CryptoMapper.toDomain(dto));
```

Aplicado en: `crypto.mapper.ts`, `product.mapper.ts`, `task.mapper.ts`.

---

### Corrección E3 + E6 — `fetchWithCache` con tres fases independientes

```
FASE 1 — RED
  fetch(url) → si falla → buscar caché IndexedDB → si no hay, relanzar

FASE 2 — MAPEO
  mapperFn(rawData) → si falla → log "Error al transformar" → relanzar (sin buscar caché)

FASE 3 — GUARDADO
  storage.save(cleanData) → si falla → warn en consola → devolver datos igualmente
```

---

### Corrección E4 — Bootstrap secuencial

**Orden de ejecución en `bootstrap()`:**

```
1. initPWARegistration()       → registra Service Worker
2. await themeService.init()   → recupera tema de IndexedDB
3. renderLayout()              → pinta el esqueleto HTML
4. renderThemeSelector()       → botones de tema
5. setupNavigation()           → listeners del menú
6. updateActiveTab(marketTab)  → pestaña activa visualmente
7. await loadMarket()          → primera carga de datos
```

---

## 4. Archivos nuevos y modificados

### Archivos NUEVOS (para estudiar primero)

| Archivo                       | Propósito                                | Prioridad de estudio |
| ----------------------------- | ---------------------------------------- | -------------------- |
| `.env.example`                | Plantilla de variables de entorno        | ⭐⭐⭐               |
| `src/config/env.ts`           | Validación centralizada de URLs de API   | ⭐⭐⭐               |
| `src/vite-env.d.ts`           | Tipos TypeScript para variables `VITE_*` | ⭐⭐                 |
| `src/utils/fetchWithCache.ts` | Red + caché offline + mapeo              | ⭐⭐⭐               |
| `docs/FIXES.md`               | Este documento                           | ⭐                   |

### Archivos MODIFICADOS

| Archivo                             | Qué cambió                                                                 |
| ----------------------------------- | -------------------------------------------------------------------------- |
| `src/main.ts`                       | Refactor completo: `bootstrap()`, `renderBootError()`, navegación extraída |
| `src/services/crypto.services.ts`   | Usa `env` + `fetchWithCache`, sin headers incorrectos                      |
| `src/services/product.services.ts`  | Idem                                                                       |
| `src/services/task.service.ts`      | Idem                                                                       |
| `src/mappers/crypto.mapper.ts`      | `CryptoMapper.toDomain` en lugar de `this.toDomain`                        |
| `src/mappers/product.mapper.ts`     | `ProductMapper.toDomain` en lugar de `this.toDomain`                       |
| `src/mappers/task.mapper.ts`        | `TaskMapper.toDomain` en lugar de `this.toDomain`                          |
| `src/mappers/crypto.mapper.test.ts` | Test nuevo: mapper como callback suelto                                    |
| `src/ui/Layout.ts`                  | Typo HTML corregido                                                        |
| `README.md`                         | Instrucciones de `.env`, arquitectura actualizada                          |

### Archivos sin cambios (pero relevantes para entender el flujo)

| Archivo                   | Rol en la arquitectura                 |
| ------------------------- | -------------------------------------- |
| `src/services/storage.ts` | Wrapper de IndexedDB (Singleton, CRUD) |
| `src/services/theme.ts`   | Persistencia de tema en IndexedDB      |
| `src/pwa.ts`              | Registro del Service Worker (Workbox)  |
| `src/interfaces/*.ts`     | Contratos DTO y modelos de dominio     |
| `src/ui/views.ts`         | Templates HTML de cada vista           |
| `vite.config.ts`          | Configuración Vite + Tailwind + PWA    |

---

## 5. Funciones clave para estudiar

### `requireEnv()` — `src/config/env.ts`

```typescript
function requireEnv(name: keyof ImportMetaEnv): string;
```

- **Qué hace:** lee una variable `VITE_*` y lanza error descriptivo si falta.
- **Cuándo se ejecuta:** al importar `env` (arranque de la app).
- **Por qué existe:** evita URLs `undefined` silenciosas.

---

### `env` — `src/config/env.ts`

```typescript
export const env = {
  apiCoingecko: requireEnv("VITE_API_COINGECKO"),
  apiFakestore: requireEnv("VITE_API_FAKESTORE"),
  apiTasks: requireEnv("VITE_API_TASKS"),
} as const;
```

- **Qué hace:** objeto inmutable con las tres URLs base.
- **Quién lo usa:** los tres servicios (`crypto`, `product`, `task`).

---

### `fetchWithCache()` — `src/utils/fetchWithCache.ts`

```typescript
async function fetchWithCache<TRaw, TDomain>(
  url: string,
  cacheKey: string,
  mapperFn: (data: TRaw) => TDomain,
  options?: RequestInit,
): Promise<TDomain>;
```

- **Qué hace:** petición HTTP → mapeo DTO→dominio → guardado en IndexedDB.
- **Fallback:** si la red falla, devuelve la última copia cacheada.
- **Parámetros clave:**
  - `url` — endpoint completo con query params.
  - `cacheKey` — llave en IndexedDB (`"omega_crypto"`, `"omega_products"`, `"omega_tasks"`).
  - `mapperFn` — función que transforma datos crudos de la API al modelo de la UI.

**Ejemplo de uso (CryptoService):**

```typescript
return fetchWithCache<CoinGeckoDTO[], CryptoCurrency[]>(
  `${env.apiCoingecko}&per_page=${limit}`,
  "omega_crypto",
  CryptoMapper.toDomainList,
  { method: "GET", headers: { accept: "application/json" } },
);
```

---

### `CryptoMapper.toDomain()` / `toDomainList()` — `src/mappers/crypto.mapper.ts`

```typescript
static toDomain(dto: CoinGeckoDTO): CryptoCurrency
static toDomainList(dtoList: CoinGeckoDTO[]): CryptoCurrency[]
```

- **`toDomain`:** transforma un objeto crudo de CoinGecko al modelo limpio de la UI.
- **`toDomainList`:** aplica `toDomain` a cada elemento del array.
- **Lección clave:** usa `CryptoMapper.toDomain(dto)`, nunca `this.toDomain(dto)`, porque `toDomainList` se pasa como callback y pierde `this`.

---

### `bootstrap()` — `src/main.ts`

```typescript
async function bootstrap(): Promise<void>;
```

- **Qué hace:** orquesta todo el arranque de la app en orden secuencial.
- **Manejo de errores:** si falla (ej. falta `.env`), muestra `renderBootError()` en pantalla.

---

### `renderBootError()` — `src/main.ts`

```typescript
const renderBootError = (error: unknown): string
```

- **Qué hace:** genera HTML de pantalla de error de configuración.
- **Cuándo aparece:** cuando `bootstrap()` captura un error crítico (variables faltantes, etc.).

---

### `loadMarket()` / `loadInventory()` / `loadKanban()` — `src/main.ts`

```typescript
const loadMarket = async (): Promise<void>
const loadInventory = async (): Promise<void>
const loadKanban = async (): Promise<void>
```

- **Qué hacen:** pintan la vista correspondiente, llaman al servicio, renderizan datos o muestran error + Toast.
- **Patrón común:**

```
1. view.innerHTML = renderXView()     → esqueleto con spinner
2. data = await XService.get...()     → fetch + cache + mapper
3. renderX(data)                      → inyecta datos en el DOM
4. catch → mensaje de error + Toast
```

---

### `updateActiveTab()` / `setupNavigation()` — `src/main.ts`

```typescript
const updateActiveTab = (clickedTab: HTMLElement): void
const setupNavigation = (): void
```

- **`updateActiveTab`:** aplica/quita clases Tailwind para resaltar la pestaña activa.
- **`setupNavigation`:** delegación de eventos en `#main-nav`; enruta clicks a `loadMarket/Inventory/Kanban`.

---

### `initPWARegistration()` — `src/pwa.ts`

```typescript
export const initPWARegistration = (): void
```

- **Qué hace:** registra el Service Worker de Workbox.
- **Importante:** cachea archivos estáticos (HTML, JS, CSS), **no** respuestas de API.

---

### Test de regresión — `src/mappers/crypto.mapper.test.ts`

```typescript
it("should work when toDomainList is passed as a detached callback", () => {
  const mapperFn = CryptoMapper.toDomainList; // sin contexto de clase
  const result = mapperFn([mockDTO]);
  expect(result[0].symbol).toBe("BTC");
});
```

- **Por qué existe:** garantiza que el bug E5 no vuelva a ocurrir.

---

## 6. Flujo de datos de la app

```
Usuario abre la app
        │
        ▼
   bootstrap()                         ← src/main.ts
        │
        ├── initPWARegistration()       ← Service Worker (archivos estáticos)
        ├── themeService.init()         ← IndexedDB: tema guardado
        ├── renderLayout()              ← HTML base
        └── loadMarket()
                │
                ▼
        CryptoService.getTopCoins()     ← src/services/crypto.services.ts
                │
                ├── env.apiCoingecko     ← src/config/env.ts (valida .env)
                └── fetchWithCache()     ← src/utils/fetchWithCache.ts
                        │
                        ├── fetch(url)           → API CoinGecko
                        ├── CryptoMapper.toDomainList()  → DTO → dominio
                        └── storage.save("omega_crypto") → IndexedDB
                                │
                                ▼
                renderCryptoTable()       ← src/ui/crypto.table.ts
                        │
                        ▼
                Usuario ve la tabla de criptomonedas
```

**Mismo patrón para Inventory y Kanban**, cambiando servicio, mapper y componente UI.

---

## 7. Modo offline (PWA vs IndexedDB)

Hay **dos capas de caché independientes**. Es fundamental entenderlas:

| Capa               | Tecnología                   | Qué guarda                          | Cuándo funciona offline                   |
| ------------------ | ---------------------------- | ----------------------------------- | ----------------------------------------- |
| Archivos estáticos | Service Worker (Workbox)     | HTML, JS, CSS, iconos               | Tras la primera visita con internet       |
| Datos de APIs      | `fetchWithCache` + IndexedDB | Criptos, productos, tareas mapeados | Tras haber cargado datos al menos una vez |

**Consecuencia:** la primera visita sin internet mostrará errores en las APIs. Eso es comportamiento esperado, no un bug.

---

## 8. Cómo verificar que todo funciona

```bash
# 1. Configurar entorno (solo la primera vez)
cp .env.example .env

# 2. Instalar e iniciar
npm install
npm run dev

# 3. Verificar build y tests
npm run build
npm test
```

**En el navegador (F12 → Console):**

- ✅ Debe aparecer: `Bootcamp: ¡Aplicación inicializada con éxito!`
- ❌ No debe aparecer: `TypeError: reading 'toDomain'`
- ❌ No debe aparecer: `Red falló para "omega_crypto"` (con internet activa)

**En la UI:**

| Vista     | Qué deberías ver                    |
| --------- | ----------------------------------- |
| Market    | Tabla con ~10 criptomonedas         |
| Inventory | Grid con 8 productos                |
| Kanban    | Tablero con 12 tareas en 3 columnas |

---

## 9. Referencia rápida de errores en consola

| Mensaje en consola                         | Significado                                          | Solución                                         |
| ------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------ |
| `[Omega] Falta la variable "VITE_API_..."` | No existe `.env` o falta una variable                | `cp .env.example .env` y reinicia dev server     |
| `URL inválida... contiene undefined`       | `.env` no cargado (servidor no reiniciado)           | Detén y ejecuta `npm run dev` de nuevo           |
| `TypeError: reading 'toDomain'`            | Mapper perdió contexto `this`                        | Ya corregido; usa `CryptoMapper.toDomain`        |
| `[Omega] Red falló para "omega_..."`       | Sin internet o API caída                             | Normal offline; con internet, revisa Network tab |
| `[Omega] Error al transformar datos`       | La API respondió pero el JSON no coincide con el DTO | Revisar interfaces en `src/interfaces/`          |
| `HTTP 429 al consultar omega_crypto`       | Rate limit de CoinGecko                              | Esperar 1 minuto y recargar                      |
| `Error de configuración` (pantalla roja)   | Fallo crítico en `bootstrap()`                       | Leer el mensaje; suele ser `.env` faltante       |

---

## Configuración requerida (`.env`)

```env
VITE_API_COINGECKO=https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&page=1
VITE_API_FAKESTORE=https://fakestoreapi.com/products
VITE_API_TASKS=https://jsonplaceholder.typicode.com/todos
```

> Vite solo lee `.env` al **iniciar** el servidor. Si editas `.env` con el server corriendo, debes detenerlo y ejecutar `npm run dev` de nuevo.

---

## Orden sugerido de estudio

Para comprender la solución de principio a fin, lee los archivos en este orden:

1. `.env.example` — qué necesita la app para funcionar
2. `src/vite-env.d.ts` — tipos de las variables
3. `src/config/env.ts` — validación al arrancar
4. `src/utils/fetchWithCache.ts` — corazón de red + caché
5. `src/services/crypto.services.ts` — ejemplo de servicio limpio
6. `src/mappers/crypto.mapper.ts` — transformación DTO → dominio
7. `src/main.ts` — orquestación de la UI
8. `src/mappers/crypto.mapper.test.ts` — test que previene regresiones
9. `src/services/storage.ts` — cómo funciona IndexedDB
10. `src/pwa.ts` — diferencia entre caché estática y caché de datos
