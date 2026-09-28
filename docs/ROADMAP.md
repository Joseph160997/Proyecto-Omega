# Omega Markets — Roadmap

> Roadmap del producto y del proyecto. Este documento prioriza entregables, fases y criterios de aceptación sin redefinir arquitectura ni contratos de dominio.

**Estado:** Draft inicial  
**Versión:** 0.1.0  
**Última actualización:** 2026  
**Relacionado con:** [BLUEPRINT.md](BLUEPRINT.md), [ARCHITECTURE.md](ARCHITECTURE.md), [DATA_MODEL.md](DATA_MODEL.md), [API_STRATEGY.md](API_STRATEGY.md), [AI_STRATEGY.md](AI_STRATEGY.md)

---

## 1. Filosofía del roadmap

Omega Markets se construye por fases pequeñas y verificables. Cada etapa debe entregar una capa razonable de valor con criterios claros y sin sobreingeniería.

El objetivo es crecer en este orden:

```txt
Blueprint
  ↓
Foundation
  ↓
Design system
  ↓
Data contracts
  ↓
Market MVP
  ↓
Asset detail
  ↓
Portfolio core
  ↓
Interactivity
  ↓
Risk + analytics
  ↓
AI layer
  ↓
Hardening
```

---

## 2. Versiones objetivo

### v0.1.0 — Foundation

- proyecto base funcional
- tooling profesional
- validación y calidad de código

### v0.2.0 — Market MVP

- market overview
- búsqueda, filtros y ordenamiento
- soporte crypto base

### v0.3.0 — Asset Detail

- vista de activo
- candles y timeframe
- quick trade

### v0.4.0 — Portfolio Core

- saldo inicial
- compra y venta simuladas
- historial y P&L

### v0.5.0 — Interactive Core

- watchlist
- alerts
- notifications
- command palette
- briefings

### v0.6.0 — Risk + Analytics

- concentration
- allocation
- exposure
- risk flags

### v0.7.0 — Intelligence

- AI Copilot
- tools reales
- validación y confirmación

### v1.0.0 — Hardened Release

- accesibilidad
- estabilidad
- testing
- deploy y documentación

---

## 3. Fase 0 — Blueprint y definición

### Objetivo

Definir el proyecto antes de programar.

### Entregables

- [BLUEPRINT.md](BLUEPRINT.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DATA_MODEL.md](DATA_MODEL.md)
- [API_STRATEGY.md](API_STRATEGY.md)
- [AI_STRATEGY.md](AI_STRATEGY.md)
- roadmap de producto y decisiones clave

### Criterios de aceptación

- visión clara del producto
- stack definido
- riesgos y trade-offs documentados
- alcance priorizado

---

## 4. Fase 1 — Foundation

### Objetivo

Crear la base técnica del proyecto.

### Entregables

```txt
package.json
vite.config.ts
tsconfig.json
.eslintrc / eslint.config.js
.prettierrc
.env.example
README.md
src/
public/
```

### Stack base

- React + TypeScript
- Vite
- Zod
- TanStack Query
- Zustand
- React Router
- Tailwind CSS
- Vitest
- ESLint + Prettier + Husky

### Criterios de aceptación

- `npm run dev` funciona
- `npm run build` funciona
- `npm run lint` funciona
- `npm run test` funciona
- TypeScript strict sin errores críticos
- estructura base lista para features

---

## 5. Fase 2 — Design System

### Objetivo

Definir identidad visual y componentes base.

### Entregables

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
CommandPalette
```

### Requisitos

- dark/light mode
- accesibilidad mínima
- tokens semánticos
- contrastes adecuados
- reduced motion

### Criterios de aceptación

- la UI se ve profesional
- se usan tokens y no colores hardcoded
- keyboard navigation funciona
- estados vacíos y errores son legibles

---

## 6. Fase 3 — Data contracts y storage

### Objetivo

Preparar la capa de dominio, storage y validación.

### Entregables

- contratos de dominio en [DATA_MODEL.md](DATA_MODEL.md)
- repositorio de storage versionado
- migraciones reales
- validación Zod en arranque y lectura

### Criterios de aceptación

- los datos persistidos se validan antes de usarse
- storage corrupto se recupera con fallback seguro
- las entidades se pueden probar sin browser

---

## 7. Fase 4 — Market MVP

### Objetivo

Primera vista real de mercado.

### Features

- tabla de criptomonedas
- precio y 24h change
- market cap y volumen
- sparkline
- búsqueda
- filtros
- ordenamiento
- watchlist rápida

### Criterios de aceptación

- el usuario ve precios de mercado
- puede buscar y filtrar
- el estado loading/error/empty existe
- el dark/light mode funciona

---

## 8. Fase 5 — Asset Detail

### Objetivo

Ampliar la visión hacia detalle de activo.

### Features

- precio actual
- gráfico histórico
- timeframe selector
- quick trade
- action buttons
- watchlist
- alertas desde el detalle

### Criterios de aceptación

- el usuario puede ver un activo completo
- cambia timeframes
- puede crear alertas y agregar a watchlist
- la página maneja error y loading

---

## 9. Fase 6 — Portfolio Core

### Objetivo

Implementar la simulación financiera central.

### Features

- saldo inicial
- compra y venta simuladas
- cash y posiciones
- historial de transacciones
- P&L actualizado

### Criterios de aceptación

- compra y venta funcionan con validación
- no se excede el cash
- no se venden más posiciones de las disponibles
- la transacción se persiste localmente

---

## 10. Fase 7 — Interactive Core

### Objetivo

Unir mercado, detalle, portfolio, watchlist, alerts y navegación.

### Features

- rutas principales
- command palette
- notification center
- alerts activas
- daily briefing
- mejora de UX

### Criterios de aceptación

- el usuario navega entre módulos
- puede usar atajos y alertas
- puede ver summaries relevantes
- la UI es coherente entre vistas

---

## 11. Fase 8 — Risk + Analytics

### Objetivo

Volver la app útil como herramienta analítica.

### Features

- allocation
- P&L en detalle
- riesgo por concentración
- exposición por tipo
- snapshots y risk flags

### Criterios de aceptación

- el usuario entiende su rendimiento y riesgo
- los cálculos están testeados
- el sistema alerta cuando hay concentración excesiva

---

## 12. Fase 9 — Intelligence Layer

### Objetivo

Añadir IA contextual pero segura.

### Features

- intent router
- tools de portfolio y market
- AI Copilot básico
- confirmación antes de acción mutante
- briefing automático

### Criterios de aceptación

- la IA responde con datos reales de la app
- no ejecuta trades sin confirmación
- respuestas se validan con Zod
- funciona sin LLM externo como base local

---

## 13. Fase 10 — Hardening

### Objetivo

Pulir la aplicación para la primera versión profesional.

### Entregables

- tests unitarios e integración
- auditoría de accesibilidad
- error boundaries
- logging
- documentación final
- CI/CD básico

### Criterios de aceptación

- nada rompe si falla una API
- los datos persistidos son seguros y recuperables
- la app es usable por teclado
- build y tests están estables

---

## 14. Backlog por prioridad

### Prioridad crítica

- scaffold base
- design system
- validación runtime
- market table
- asset detail
- portfolio core
- buy/sell
- storage
- loading/error states

### Prioridad alta

- watchlist
- alerts
- command palette
- notifications
- daily briefing
- AI Copilot básico
- risk flags

### Prioridad media

- comparador
- journal
- export/import
- provider health
- demo mode
- terminal mode

### Prioridad baja

- social features
- large future AI
- embeddings pesados
- advanced trading

---

## 15. Riesgos principales

### 1. APIs inestables

Mitigación: fallback, cache, demo provider, circuit breaker.

### 2. Sobreingeniería

Mitigación: mantener fases pequeñas, no construir futuro sin necesidad.

### 3. IA poco útil

Mitigación: tools, datos reales, confirmación y validación.

### 4. Storage corrupto

Mitigación: schemas versionados y recuperación segura.

### 5. Accesibilidad deficiente

Mitigación: componentes con foco visible, contrastes y tests manuales básicos.

---

## 16. Definition of Done

Una feature está lista cuando:

- funciona visualmente
- está integrada de forma coherente con la arquitectura
- pasa typecheck y lint
- tiene validación si maneja datos externos
- tiene loading/error/empty state cuando aplica
- es accesible por teclado
- y está documentada si introduce un trade-off o un nuevo contrato

---

## 17. Resumen ejecutivo

La primera versión real debe centrarse en:

```txt
ver
buscar
filtrar
operar
analizar
alertar
aprender
```

La expansión futura debe avanzar hacia:

```txt
comparar
simular escenarios
rebalancear
journal
terminal mode
AI avanzada
```

---

## 18. Criterio de salida del roadmap

El proyecto puede pasar a una versión estable cuando:

- el mercado base funciona
- la cartera simula operaciones reales
- la app maneja fallos sin romper UI
- la IA aporta valor con datos reales y confirmación
- los documentos técnicos están sincronizados con la implementación
