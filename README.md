# Proyecto Omega | Senior Ecosystem

Dashboard modular en **Vanilla TypeScript** con tres módulos de datos en tiempo real, caché offline (IndexedDB), soporte PWA y arquitectura Service-Mapper.

## Tabla de contenidos

- [Inicio](#inicio)
- [Módulos](#módulos)
- [Stack tecnológico](#stack-tecnológico)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Configuración (.env)](#configuración-env)
- [Scripts disponibles](#scripts-disponibles)
- [Arquitectura](#arquitectura)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Testing](#testing)
- [Modo offline y PWA](#modo-offline-y-pwa)
- [Documentación adicional](#documentación-adicional)
- [Licencia](#licencia)

---

## Inicio

Proyecto Omega es un ecosistema frontend pensado para ser modular y fácil de mantener. Orquesta tres fuentes de datos externas, las normaliza con Mappers y las presenta en una SPA sin frameworks.

---

## Módulos

| Módulo | Vista | API | Servicio |
|--------|-------|-----|----------|
| **Market** | Tabla de criptomonedas | [CoinGecko](https://www.coingecko.com/) | `CryptoService` |
| **Inventory** | Grid de productos | [Fake Store](https://fakestoreapi.com/) | `ProductService` |
| **Kanban** | Tablero de tareas | [JSONPlaceholder](https://jsonplaceholder.typicode.com/) | `TaskService` |

Además incluye un **selector de temas** con persistencia en IndexedDB y registro PWA para uso offline de archivos estáticos.

---

## Stack tecnológico

- **TypeScript** + **Vite 8**
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **Fetch API** + **IndexedDB** (caché de datos de APIs)
- **vite-plugin-pwa** + Workbox (caché de assets estáticos)
- **Vitest** (tests unitarios de Mappers)

---

## Instalación y ejecución

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/Joseph160997/Proyecto-Omega.git
   cd Proyecto-Omega
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno (**obligatorio**):
   ```bash
   cp .env.example .env
   ```

4. Ejecutar en desarrollo:
   ```bash
   npm run dev
   ```

5. Compilar para producción:
   ```bash
   npm run build
   ```

6. Previsualizar el build:
   ```bash
   npm run preview
   ```

> Si las APIs no cargan datos, consulta [`docs/FIXES.md`](docs/FIXES.md) — incluye diagnóstico de errores, correcciones aplicadas y guía de estudio del código.

---

## Configuración (.env)

Copia `.env.example` a `.env` en la raíz del proyecto:

```env
VITE_API_COINGECKO=https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&page=1
VITE_API_FAKESTORE=https://fakestoreapi.com/products
VITE_API_TASKS=https://jsonplaceholder.typicode.com/todos
```

| Variable | Descripción |
|----------|-------------|
| `VITE_API_COINGECKO` | URL base del endpoint de mercado de CoinGecko |
| `VITE_API_FAKESTORE` | URL base de Fake Store API |
| `VITE_API_TASKS` | URL base de JSONPlaceholder (todos) |

**Importante:** Vite solo lee `.env` al **iniciar** el servidor. Si creas o editas el archivo con `npm run dev` en marcha, detén el proceso y vuelve a ejecutarlo.

Las variables se validan al arrancar en `src/config/env.ts`. Si falta alguna, la app muestra una pantalla de error de configuración.

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo (Vite) |
| `npm run build` | Compilación TypeScript + build de producción |
| `npm run preview` | Sirve la carpeta `dist/` localmente |
| `npm run test` | Ejecuta tests unitarios con Vitest |

---

## Arquitectura

### Patrones principales

- **Service-Mapper Pattern** — los servicios obtienen datos crudos (DTO); los mappers los transforman al modelo de dominio de la UI.
- **fetchWithCache** — utilidad central que combina red, mapeo y persistencia en IndexedDB con fallback offline.
- **Bootstrap secuencial** — `main.ts` inicializa PWA, tema, layout y primera vista en orden controlado con `async/await`.
- **UI Composition** — componentes en `src/ui/` generan HTML; `main.ts` orquesta navegación y carga de datos.

### Flujo de datos (resumido)

```
bootstrap() → Servicio → fetchWithCache → Mapper → IndexedDB → Componente UI
```

---

## Estructura del proyecto

```
proyecto-omega/
├── .env.example              # Plantilla de variables de entorno
├── docs/
│   └── FIXES.md              # Diagnóstico, correcciones y guía de estudio
├── public/                   # Iconos PWA e assets estáticos
├── src/
│   ├── config/
│   │   └── env.ts            # Validación de variables VITE_*
│   ├── interfaces/           # Contratos DTO y modelos de dominio
│   ├── mappers/              # Transformación DTO → dominio + tests
│   ├── services/
│   │   ├── crypto.services.ts
│   │   ├── product.services.ts
│   │   ├── task.service.ts
│   │   ├── storage.ts        # Wrapper IndexedDB
│   │   └── theme.ts          # Persistencia de tema
│   ├── ui/                   # Componentes de interfaz (Layout, views, cards…)
│   ├── utils/
│   │   └── fetchWithCache.ts # Red + caché offline
│   ├── main.ts               # Punto de entrada y bootstrap
│   ├── pwa.ts                # Registro del Service Worker
│   └── vite-env.d.ts         # Tipos TypeScript para import.meta.env
├── index.html
├── vite.config.ts            # Vite + Tailwind + PWA
└── package.json
```

### Archivos clave

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/main.ts` | Bootstrap, navegación, carga de vistas |
| `src/config/env.ts` | Validación de `.env` al arrancar |
| `src/utils/fetchWithCache.ts` | Peticiones HTTP con caché en IndexedDB |
| `src/services/storage.ts` | Abstracción CRUD sobre IndexedDB |
| `src/pwa.ts` | Registro del Service Worker (Workbox) |

---

## Testing

```bash
npm run test
```

Tests unitarios para los tres Mappers:

- `src/mappers/crypto.mapper.test.ts`
- `src/mappers/product.mapper.test.ts`
- `src/mappers/task.mapper.test.ts`

Validan la transformación DTO → dominio, incluido el caso en que el mapper se pasa como callback (patrón `fetchWithCache`).

---

## Modo offline y PWA

La app tiene **dos capas de caché** independientes:

| Capa | Tecnología | Qué guarda |
|------|------------|------------|
| Assets estáticos | Service Worker (Workbox) | HTML, JS, CSS, iconos |
| Datos de APIs | `fetchWithCache` + IndexedDB | Criptos, productos, tareas |

- Tras la primera visita con internet, la app funciona offline a nivel de **interfaz**.
- Los **datos de APIs** solo están disponibles offline si se cargaron al menos una vez con conexión.

---

## Documentación adicional

| Documento | Contenido |
|-----------|-----------|
| [`docs/FIXES.md`](docs/FIXES.md) | Errores detectados, correcciones, funciones clave y orden de estudio |
| Comentarios en `src/` | Detalle de implementación por módulo |

---

## Licencia

MIT — ver archivo [`LICENSE`](LICENSE).
