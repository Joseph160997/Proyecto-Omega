<p align="center">
	<img src="./public/favicon.svg" alt="" width="64" height="64" />
</p>

<h1 align="center">Omega Markets</h1>

<p align="center">
	Una terminal financiera educativa para explorar mercados y aprender mediante simulaciones, sin arriesgar dinero real.
</p>

<p align="center">
	<img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
	<img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white" />
	<img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" />
	<img alt="Tailwind CSS 4" src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" />
	<img alt="Node.js 22" src="https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white" />
</p>

<p align="center">
	<img alt="React Router 7" src="https://img.shields.io/badge/React_Router-7-CA4245?logo=reactrouter&logoColor=white" />
	<img alt="TanStack Query 5" src="https://img.shields.io/badge/TanStack_Query-5-FF4154?logo=reactquery&logoColor=white" />
	<img alt="Zustand 5" src="https://img.shields.io/badge/Zustand-5-443E38" />
	<img alt="Zod 4" src="https://img.shields.io/badge/Zod-4-3E67B1?logo=zod&logoColor=white" />
	<img alt="Vitest 5" src="https://img.shields.io/badge/Vitest-5-6E9F18?logo=vitest&logoColor=white" />
</p>

<p align="center">
	<img alt="GitHub Actions CI" src="https://img.shields.io/badge/CI-GitHub_Actions-2088FF?logo=githubactions&logoColor=white" />
	<img alt="Vercel" src="https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white" />
	<img alt="ESLint" src="https://img.shields.io/badge/ESLint-10-4B32C3?logo=eslint&logoColor=white" />
	<img alt="Prettier" src="https://img.shields.io/badge/Prettier-3-F7B93E?logo=prettier&logoColor=white" />
</p>

## Índice

- [Omega Markets](#omega-markets)
- [El proyecto](#el-proyecto)
- [Disponible hoy](#disponible-hoy)
- [Próximas etapas](#próximas-etapas)
- [Arquitectura](#arquitectura)
- [Tecnologías](#tecnologías)
- [Inicio rápido](#inicio-rápido)
- [Comandos](#comandos)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Calidad y CI](#calidad-y-ci)
- [Despliegue y seguridad](#despliegue-y-seguridad)
- [Documentación](#documentación)

## El proyecto

Omega Markets es una aplicación web de simulación financiera. Su objetivo es ofrecer un espacio claro para observar activos, consultar información de mercado y desarrollar herramientas de análisis y operación virtual.

No es un broker ni una plataforma para operar con capital real. Las funciones de compra y venta simuladas forman parte de la evolución del producto; consulta [Próximas etapas](#próximas-etapas) para conocer el alcance planeado.

## Disponible hoy

Las rutas y áreas conectadas actualmente en la aplicación son:

- **Dashboard:** vista general y puntos de entrada al workspace.
- **Markets:** explorador de mercado con búsqueda, orden, vistas y paginación; el estado de navegación se puede compartir mediante la URL.
- **Portfolio:** espacio para consultar el portafolio virtual.
- **Watchlist:** acceso a activos seguidos.
- **Alerts e History:** áreas de alertas e historial.
- **Settings:** preferencias visuales, incluido el tema claro u oscuro.

El shell común incorpora navegación lateral e inferior, estados de notificación, pie de página y una página de recuperación ante errores de renderizado. La interfaz usa tokens semánticos y cuenta con comprobaciones de accesibilidad estructural.

## Próximas etapas

La siguiente lista resume el [roadmap del producto](../docs/ROADMAP.md). Son objetivos de evolución, no una promesa de que ya estén disponibles:

1. **Detalle de activos:** gráficos históricos, selección de timeframe y acceso contextual a watchlist y alertas.
2. **Portfolio simulado:** saldo inicial, compra y venta virtual, posiciones, historial de transacciones y P&L persistido.
3. **Analítica de riesgo:** asignación, exposición, concentración y señales de riesgo.
4. **Herramientas interactivas:** command palette, resúmenes diarios y mayor conexión entre mercado, portafolio y alertas.
5. **Capa de inteligencia:** asistente contextual con herramientas validadas y confirmación antes de acciones mutables.
6. **Hardening:** ampliar pruebas, accesibilidad, manejo de fallos, documentación y automatización de entrega.

El orden y los criterios de aceptación se mantienen en el roadmap para evitar duplicar decisiones de producto aquí.

## Arquitectura

La aplicación se organiza por límites de responsabilidad: la UI y las features coordinan interacción; application orquesta casos de uso; domain mantiene reglas y contratos; services adaptan APIs y almacenamiento.

```text
React UI / Features
				|
				v
Application: casos de uso y coordinación
				|
				v
Domain: reglas, cálculos y contratos
				^
				|
Services: API, storage y adaptadores
```

El estado remoto se gestiona con TanStack Query; el estado de cliente compartido usa Zustand donde corresponde, y la URL conserva el estado de navegación compartible.

## Tecnologías

| Área              | Herramientas                                                   |
| ----------------- | -------------------------------------------------------------- |
| Aplicación        | React 19, React DOM, TypeScript, Vite 8                        |
| UI y estilos      | Tailwind CSS 4, tokens CSS, Lucide React, IBM Plex Sans y Mono |
| Rutas y estado    | React Router 7, TanStack Query 5, Zustand 5                    |
| Dominio y datos   | Zod 4, Decimal.js, adaptadores de mercado y storage            |
| Tests y calidad   | Vitest 5, Testing Library, axe-core, ESLint 10, Prettier 3     |
| Entorno y entrega | Node.js 22, npm, GitHub Actions, Husky y Vercel                |

## Inicio rápido

Requisitos: Node.js 22 y npm.

```sh
cd web
npm ci
npm run dev
```

Vite imprime en la terminal la URL local. Para comprobar una compilación de producción, usa `npm run build`.

## Comandos

- `npm run dev`: servidor de desarrollo.
- `npm run build`: comprobación de tipos y build de producción.
- `npm test`: ejecuta Vitest una vez.
- `npm run test:watch`: ejecuta Vitest en modo interactivo.
- `npm run lint`: análisis estático con ESLint.
- `npm run typecheck`: comprobación de TypeScript.
- `npm run format:check`: verifica el formato con Prettier.
- `npm run verify`: formato, lint, tipos, tests y build.

## Estructura del repositorio

```text
proyecto-omega/
├── .github/workflows/ci.yml   # CI para pull requests y main
├── docs/                      # Blueprint, arquitectura, datos, APIs, IA y roadmap
└── web/
		├── public/                # Recursos estáticos, incluido el favicon
		├── src/
		│   ├── app/               # Router y providers
		│   ├── application/       # Casos de uso y puertos
		│   ├── components/        # Layout, feedback y UI reutilizable
		│   ├── domain/            # Reglas, entidades y contratos
		│   ├── features/          # Dashboard, markets, portfolio y otras áreas
		│   ├── services/          # Adaptadores de API y almacenamiento
		│   ├── stores/            # Estado de cliente
		│   ├── styles/            # Tokens y pruebas de estilos
		│   └── test-utils/        # Fixtures y helpers de tests
		├── index.html
		├── package.json
		└── vercel.json
```

## Calidad y CI

GitHub Actions usa Node.js 22, instala desde `package-lock.json` y ejecuta `npm run verify` en cada pull request y en los pushes a `main`. Los tests de accesibilidad con axe revisan estructura DOM; el contraste se comprueba por separado con los tokens de diseño.

## Despliegue y seguridad

Configura `web` como raíz del proyecto en Vercel. [`vercel.json`](vercel.json) aplica el fallback de rutas de la SPA y las cabeceras `nosniff`, `Referrer-Policy`, `X-Frame-Options` y `Permissions-Policy`.

No se configura todavía una Content Security Policy. El script inline que aplica el tema antes del primer render requiere un hash o nonce antes de habilitar una política estricta.

## Documentación

- [Blueprint del producto](../docs/BLUEPRINT.md)
- [Arquitectura](../docs/ARCHITECTURE.md)
- [Modelo de datos](../docs/DATA_MODEL.md)
- [Estrategia de APIs](../docs/API_STRATEGY.md)
- [Estrategia de IA](../docs/AI_STRATEGY.md)
- [Roadmap](../docs/ROADMAP.md)
