# Omega Markets — Architecture

> Define la organización del sistema, sus límites de dependencia y los flujos entre capas. Los contratos de dominio, proveedores y herramientas de IA se mantienen en los documentos especializados enlazados más abajo.

**Estado:** Draft inicial  
**Versión:** 0.1.0  
**Relacionado con:** [BLUEPRINT.md](BLUEPRINT.md), [DATA_MODEL.md](DATA_MODEL.md), [API_STRATEGY.md](API_STRATEGY.md), [AI_STRATEGY.md](AI_STRATEGY.md)

---

## 1. Propósito y límites

Omega Markets es una SPA con React y TypeScript, organizada por features y con una capa de dominio independiente del framework. Este documento fija quién puede depender de quién, dónde ocurre cada operación y cómo se recupera la aplicación al iniciar o fallar una dependencia.

Fuentes canónicas para evitar mantener la misma definición en varios lugares:

| Tema                                                        | Fuente canónica                    |
| ----------------------------------------------------------- | ---------------------------------- |
| Visión, alcance y decisiones de producto                    | [BLUEPRINT.md](BLUEPRINT.md)       |
| Capas, flujos, dependencias y bootstrap                     | Este documento                     |
| Entidades, contratos, invariantes y persistencia de dominio | [DATA_MODEL.md](DATA_MODEL.md)     |
| APIs, providers, cache, límites y fallback de mercado       | [API_STRATEGY.md](API_STRATEGY.md) |
| IA, tools, guardrails y privacidad                          | [AI_STRATEGY.md](AI_STRATEGY.md)   |

Este documento no redefine schemas, listas de campos, endpoints ni payloads de IA; remite a sus fuentes canónicas.

---

## 2. Principios arquitectónicos

1. **Dominio puro:** las reglas financieras no dependen de React, proveedores, almacenamiento ni estado global.
2. **Adaptación en las fronteras:** los formatos externos se convierten a contratos internos antes de llegar al dominio.
3. **Dependencias explícitas:** cada feature consume casos de uso o contratos, no implementaciones ajenas de infraestructura.
4. **Fallo por fases:** un fallo de red, transformación, persistencia o renderizado se diagnostica y trata en su propia fase.
5. **Bootstrap secuencial:** los requisitos de arranque se resuelven antes de presentar la aplicación interactiva.
6. **Modularidad proporcional:** separar responsabilidades donde exista una razón de cambio distinta, sin crear capas vacías.

---

## 3. Capas y responsabilidades

```txt
UI / Features
      ↓
Application (use cases, query hooks, commands)
      ↓
Domain (rules, calculations, contracts)
      ↑
Infrastructure (API adapters, repositories, AI adapters)
```

### UI y features

- Componen páginas y controles, capturan interacción y muestran estados accesibles.
- No conocen APIs concretas ni acceden directamente a IndexedDB.
- No contienen cálculos financieros autoritativos.
- Cada feature agrupa su UI y lógica de presentación; la lógica compartida vive en módulos compartidos solo si tiene más de un consumidor real.

### Application

- Orquesta casos de uso y coordina dominio e infraestructura.
- Expone hooks para consultas y comandos para operaciones con efectos.
- Es el lugar de invalidación/actualización de consultas y coordinación de efectos posteriores a una operación.
- Valida la intención y los datos de entrada antes de solicitar una mutación de dominio.

### Domain

- Define tipos, invariantes, cálculos y decisiones financieras reproducibles.
- Debe ser ejecutable en tests sin navegador ni red.
- No importa React, Zustand, TanStack Query, Zod adapters de providers ni IndexedDB.
- Los contratos completos de dominio se mantienen únicamente en [DATA_MODEL.md](DATA_MODEL.md).

### Infrastructure

- Implementa puertos requeridos por la aplicación: proveedores de mercado, repositorios, reloj/IDs cuando haga falta y adaptadores de IA.
- Traduce datos externos y errores técnicos a contratos internos.
- Las decisiones específicas de API y persistencia se documentan en [API_STRATEGY.md](API_STRATEGY.md) y [DATA_MODEL.md](DATA_MODEL.md).

---

## 4. Dependencias permitidas

```txt
UI / Features  → Application
Application    → Domain
Application    → Infrastructure abstractions
Infrastructure → Domain contracts
```

No permitido:

```txt
Domain → UI, Application o Infrastructure
UI → providers, fetch directo o repositorios concretos
Feature A → implementación interna de Feature B
```

Las dependencias compartidas deben exponerse mediante contratos pequeños y estables. Evitar barrels que oculten ciclos o importaciones que creen dependencias entre features solo por conveniencia.

---

## 5. Organización del código

Estructura objetivo, adaptable al repositorio existente cuando se migre:

```txt
src/
├── app/                 # bootstrap, router y providers globales
├── features/            # dashboard, markets, portfolio, alerts, ai, etc.
├── domain/              # reglas y tipos independientes de framework
├── infrastructure/      # API, storage y adaptadores externos
├── shared/              # UI/utilidades realmente transversales
└── styles/              # tokens y estilos globales
```

Dentro de una feature se pueden mantener `components/`, `hooks/`, `schemas/` y `__tests__/` locales. No crear carpetas por anticipado sin consumidores. La estructura actual del Proyecto Omega es una base de migración, no una obligación de renombrar todo de una vez.

---

## 6. Flujos de aplicación

### Consulta de mercado

```txt
Route → page → query hook → market use case
      → provider port → provider adapter
      → validación y mapping → domain quote → query cache → UI
```

El contrato de proveedor, el orden de fallback y la política de cache pertenecen a [API_STRATEGY.md](API_STRATEGY.md). Las formas de `Quote` y `Candle` pertenecen a [DATA_MODEL.md](DATA_MODEL.md).

### Orden simulada

```txt
UI form → input validation → order preview use case
        → domain validation/calculation
        → user confirmation
        → execute simulated order
        → repository transaction
        → refresh affected queries / emit domain event
```

La mutación debe ser atómica desde el punto de vista del usuario: no confirmar la operación si falla la actualización persistida. Las reglas de dinero, posiciones y transacciones se definen en [DATA_MODEL.md](DATA_MODEL.md).

### Evento de alerta

```txt
quote/portfolio update → alert evaluator
                        → persist alert state
                        → create notification
                        → update visible notification state
```

El evaluador de alertas es lógica de aplicación/dominio; un bus de eventos solo desacopla efectos posteriores, no sustituye el estado persistido ni la llamada explícita del caso de uso.

### Consulta de IA

```txt
input → intent/route → authorized tools → validated tool results
      → local response or optional model → validated response
      → render or confirmation flow
```

La selección de tools, contratos de salida y guardrails se definen exclusivamente en [AI_STRATEGY.md](AI_STRATEGY.md).

---

## 7. Estado y persistencia

Cada estado tiene un dueño:

- **Server state:** datos remotos y sus estados de carga/error/caché; TanStack Query.
- **Client state:** estado de interacción compartido que no es resultado de una consulta; Zustand cuando la complejidad lo justifique.
- **URL state:** filtros y selección que deban ser compartibles o restaurables mediante navegación.
- **Form state:** estado local del formulario y validación de entrada.
- **Persisted state:** datos de usuario que deben sobrevivir recargas; acceso mediante repositorios, nunca desde componentes.

No duplicar el mismo valor en Zustand y TanStack Query sin una política explícita de sincronización. Las claves, versiones, esquemas y migraciones persistidos se definen en [DATA_MODEL.md](DATA_MODEL.md); TanStack Query no es almacenamiento durable.

---

## 8. Bootstrap y tema

El arranque debe ser una secuencia explícita y observable, preservando la corrección aprendida en el Proyecto Omega:

1. Instalar manejadores globales de error y configuración mínima.
2. Validar configuración de entorno necesaria para iniciar.
3. Inicializar el repositorio local y recuperar/migrar preferencias críticas.
4. Aplicar el tema antes del primer render visible para evitar parpadeo.
5. Crear providers de React, router y cliente de consultas.
6. Renderizar la aplicación.
7. Cargar datos de cada vista de forma independiente; un provider de mercado opcional no debe bloquear el shell completo.

Cada paso debe tener un error visible y recuperable cuando sea posible. La inicialización de PWA puede ejecutarse en paralelo si no afecta el tema ni el estado crítico.

El servicio de tema conserva el propósito del `themeService` legado. En React puede exponerse mediante provider/hook, pero el acceso al storage sigue detrás del repositorio y la preferencia persistida sigue el contrato de [DATA_MODEL.md](DATA_MODEL.md).

---

## 9. Errores y degradación

Los errores se clasifican por frontera y se traducen a mensajes útiles en la UI:

| Frontera           | Tratamiento                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| Configuración      | Fallo de arranque con nombre de variable/ajuste inválido, sin revelar secretos                   |
| Red/provider       | Timeout, retry limitado y fallback; ver [API_STRATEGY.md](API_STRATEGY.md)                       |
| Validación/mapping | Rechazar el payload inválido; no etiquetarlo como fallo de red                                   |
| Persistencia       | Separar fallo de lectura/escritura; una cache opcional fallida no invalida una respuesta válida  |
| Regla de dominio   | Rechazar la operación con razón estable y presentable                                            |
| IA/tool            | Validar input/output, limitar efectos y pedir confirmación; ver [AI_STRATEGY.md](AI_STRATEGY.md) |
| UI                 | Error boundary por sección para aislar fallos de renderizado                                     |

Conservar el patrón corregido de `fetchWithCache`: request, validación/mapeo y persistencia son fases separadas. Si una respuesta válida no puede guardarse en una cache no esencial, devolverla igualmente; si la persistencia de una operación simulada es esencial, no declarar la operación completada.

---

## 10. Eventos

El event bus existente inspira una capa selectiva, no un mecanismo universal de estado.

Usarlo solo para efectos desacoplados como notificaciones o telemetría local después de una transición confirmada. Los nombres y contratos de eventos deben estar tipados, y los listeners deben limpiarse al desmontarse.

No usar PubSub para:

- estado que necesita lectura inmediata y durable;
- navegación y flujo de control principal;
- validación de órdenes;
- actualización que pueda expresarse como resultado/efecto del caso de uso.

Los eventos de negocio concretos se agregan junto con la feature que los necesita; no mantener un catálogo especulativo duplicado en este documento.

---

## 11. Validación y seguridad: límites

La regla arquitectónica es validar en las fronteras, no repetir reglas en cada capa. La definición de schemas de entidades y storage está en [DATA_MODEL.md](DATA_MODEL.md); contratos de providers en [API_STRATEGY.md](API_STRATEGY.md); respuestas y acciones de IA en [AI_STRATEGY.md](AI_STRATEGY.md).

La UI presenta contenido como texto seguro, no ejecuta acciones mutables por inferencia y nunca contiene secretos. Los detalles de claves frontend y proxy pertenecen a [API_STRATEGY.md](API_STRATEGY.md); privacidad de contexto externo pertenece a [AI_STRATEGY.md](AI_STRATEGY.md).

---

## 12. Pruebas y calidad

- **Unitarias:** reglas de dominio y transformaciones puras, con fixtures pequeños.
- **Contrato:** schemas y adaptadores de providers frente a respuestas válidas e inválidas.
- **Integración:** hooks/casos de uso, fallback, persistencia y flujo de orden.
- **E2E:** recorridos críticos de usuario cuando la UI y las rutas estén disponibles.

Los mappers deben tener pruebas propias: entrada DTO válida produce dominio canónico; campos inválidos o casos límite no deben convertirse silenciosamente en datos plausibles. No duplicar pruebas de la misma regla en todas las capas; probar el contrato en su dueño y añadir integración solo cuando verifique interacción entre módulos.

Cada feature debe declarar los estados de carga, error y vacío que le correspondan. Los criterios funcionales de producto y releases permanecen en el roadmap cuando se incorpore al repositorio.

---

## 13. Evolución desde Proyecto Omega

| Patrón existente      | Continuidad en Omega Markets                                             |
| --------------------- | ------------------------------------------------------------------------ |
| DTO → Mapper → Domain | Se conserva; la validación runtime ocurre antes del mapper               |
| `fetchWithCache`      | Se separan red, parseo/mapeo y cache; ver sección 9 y estrategia de APIs |
| IndexedDB singleton   | Se encapsula detrás de repositorios con validación/versionado            |
| PubSub                | Se limita a efectos desacoplados posteriores a una transición            |
| `themeService`        | Se integra con el bootstrap y el estado de tema de React                 |
| Bootstrap secuencial  | Se conserva como arranque explícito y testeable                          |
| Tests de mappers      | Se mantienen como pruebas de contrato de DTO a dominio                   |

Los errores históricos detallados y sus correcciones siguen documentados en [FIXES.md](FIXES.md); no se copia aquí su diagnóstico paso a paso.

---

## 14. Criterio para añadir una capa o abstracción

Añadirla cuando exista al menos una necesidad verificable: sustituir un proveedor, reutilizar una regla, controlar efectos o probar una frontera sin depender de terceros. Si solo reenvía llamadas y no protege una frontera, mantener la solución más simple.
