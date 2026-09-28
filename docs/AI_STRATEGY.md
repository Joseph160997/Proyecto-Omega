# Omega Markets — AI Strategy

> Estrategia para la capa de IA del proyecto. Este documento define intención, herramientas, guardrails, validación y UX sin duplicar las decisiones de arquitectura, dominio o proveedores.

**Estado:** Draft inicial  
**Versión:** 0.1.0  
**Relacionado con:** [ARCHITECTURE.md](ARCHITECTURE.md), [DATA_MODEL.md](DATA_MODEL.md), [API_STRATEGY.md](API_STRATEGY.md), [BLUEPRINT.md](BLUEPRINT.md)

---

## 1. Objetivo

La IA de Omega Markets debe ser útil, contextual y segura.

No queremos un chatbot decorativo. Queremos una capa inteligente que:

- entiende el estado de la app
- consulta datos reales
- ejecuta herramientas específicas
- puede sugerir acciones confirmables
- funciona con motor local si no hay LLM externo
- valida todo lo que responde

---

## 2. Principios

### 2.1 Datos reales

La IA no debe inventar precios, valores, posiciones ni riesgo.

Debe consultar servicios y dominio real de la aplicación.

### 2.2 Herramientas primeras

La IA debe usar tools antes que improvisar respuestas.

### 2.3 Confirmación obligatoria

No se ejecutan acciones mutantes sin confirmación del usuario.

### 2.4 Validación de salida

Toda respuesta de IA pasa por Zod antes de renderizarse.

### 2.5 Evolución incremental

Se empieza con local insights + tools + router antes que con LLM pesado o embeddings complejos.

---

## 3. Arquitectura de IA

```txt
User input
  ↓
Intent router
  ↓
Tool selector
  ↓
Context builder
  ↓
Local engine / LLM adapter
  ↓
Validator
  ↓
UI output or confirmation flow
```

---

## 4. Intents

```ts
type AiIntent =
  | "portfolio_query"
  | "market_query"
  | "education_query"
  | "action_request"
  | "risk_analysis"
  | "briefing_request"
  | "unknown";
```

Ejemplos:

| Input                        | Intent           |
| ---------------------------- | ---------------- |
| “¿Cómo está mi portafolio?”  | portfolio_query  |
| “¿Qué crypto subió más hoy?” | market_query     |
| “¿Qué es un P&L?”            | education_query  |
| “Vender 0.05 BTC”            | action_request   |
| “¿Estoy muy concentrado?”    | risk_analysis    |
| “Resumen de hoy”             | briefing_request |

---

## 5. Tools iniciales

### Tool definition

```ts
interface AiToolDefinition {
  name: string;
  description: string;
  mutatesState: boolean;
  requiresConfirmation: boolean;
  inputSchema: ZodSchema;
  outputSchema: ZodSchema;
  handler: (input: unknown) => Promise<unknown>;
}
```

### Tools sugeridos

- `getPortfolioSummary()`
- `getAssetQuote(assetId)`
- `getTopMovers()`
- `getAllocation()`
- `getRiskFlags()`
- `getDailyBriefing()`
- `simulateOrder(side, assetId, quantity)`
- `createAlert(assetId, condition)`
- `compareAssets(assetIds)`
- `explainConcept(term)`

### Regla importante

`simulateOrder` debe devolver preview, no ejecutar la orden.

---

## 6. Local Insights Engine

La base funcional inicial no depende de un LLM externo.

### Responsabilidades

- daily briefing determinístico
- risk flags locales
- resumen de cartera
- watchlist movers
- ayuda educativa básica

### Ejemplos

- “Tu portafolio tiene alta concentración en BTC.”
- “Tu exposición crypto supera el 65%.”
- “Tu cash disponible está bajo el 10%.”

---

## 7. Context Builder

La IA solo debe recibir contexto relevante y seguro.

```ts
interface AiContext {
  portfolioSummary?: PortfolioSummary;
  allocation?: AllocationItem[];
  riskFlags?: RiskFlag[];
  topMovers?: Quote[];
  watchlist?: string[];
  settings?: PublicSettings;
}
```

No incluir:

- claves
- tokens
- secretos
- datos sensibles
- payloads innecesarios

---

## 8. LLM adapter opcional

Cuando exista LLM externo, se conecta con un adapter:

```ts
interface LlmAdapter {
  generate(input: LlmInput): Promise<LlmOutput>;
}
```

Implementaciones futuras:

- OpenAI
- Anthropic
- local model
- mock adapter para tests

El adapter no reemplaza los tools ni la validación final.

---

## 9. Validation and guardrails

### Validación de salida

```ts
const AiResponseSchema = z.object({
  intent: z.string(),
  message: z.string(),
  insights: z.array(InsightSchema).optional(),
  actions: z.array(AiActionSchema).optional(),
  confidence: z.number().min(0).max(1).optional(),
});
```

### Guardrails

La IA debe:

- no inventar precios o posiciones
- no ejecutar trades automáticamente
- no constituir asesoría financiera profesional
- indicar cuando no tiene datos suficientes
- mostrar fuente o contexto cuando corresponda

---

## 10. Daily briefing

El briefing debe ser generado con datos reales.

Ejemplo:

```txt
Daily Briefing

Portfolio total: $12,450
Daily change: +1.2%
Top contributor: BTC
Worst performer: ETH
Crypto exposure: 64%
Risk flag: alta concentración en BTC
```

Fuentes:

- portfolio state
- market quotes
- risk engine
- watchlist moved assets

---

## 11. RAG ligero

### Objetivo

Responder preguntas educativas y contextuales con conocimiento local.

### Base de conocimiento

- conceptos financieros
- métricas de portfolio
- riesgo y diversificación
- órdenes y alertas
- documentación del producto

### Primera versión

- búsqueda léxica simple
- metadata por tags
- sin embeddings pesados

### Futuro

- embeddings locales
- reranking
- memory contextual
- multilingüe

---

## 12. UX de IA

### AI panel

```txt
AI Copilot
├── chat input
├── suggested prompts
├── tool results
├── insights
└── confirmation cards
```

### Suggested questions

```txt
¿Cómo está mi portafolio?
¿Estoy muy concentrado?
¿Qué subió más hoy?
Explícame mi P&L
Simular venta de BTC
```

### Action cards

Cuando la IA propone una acción:

```txt
[Confirmar venta simulada]
[Cancelar]
```

La acción debe mostrar datos relevantes antes de confirmar.

---

## 13. Seguridad y privacidad

- no enviar secretos a servicios externos
- no guardar todos los chats en un store sin intención clara
- no ejecutar sin confirmación acciones que modifiquen estado
- si no hay LLM externo, usar local engine
- si hay LLM externo, permitir desactivar y limitar contexto

---

## 14. Testing de IA

### Unit tests

- intent router
- tool handlers
- output validation
- daily briefing generation
- risk flag inference

### Integration tests

```txt
user prompt -> intent -> tool -> validated result -> UI render
```

### Mock LLM

Se puede simular un adapter para tests sin depender de una API externa.

---

## 15. Métricas de éxito

### Utilidad

- el usuario obtiene respuestas con datos reales
- los insights tienen sentido
- la IA ayuda al usuario a entender el portfolio

### Seguridad

- ninguna acción mutante se ejecuta sin confirmación
- las salidas invalidas no llegan a UI
- no se exponen claves ni secrets

### Rendimiento

- las respuestas simples son rápidas
- no se hacen requests innecesarias
- el local engine sirve como base sólida

---

## 16. Roadmap de IA

### Fase 1 — Local insights

- daily briefing
- risk flags
- insight cards

### Fase 2 — AI panel básico

- chat panel
- prompts sugeridos
- respuestas localmente validadas

### Fase 3 — Tools

- portfolio summary
- asset quote
- top movers
- simulate order preview

### Fase 4 — Intent router

- clasificación de intención
- selector de tools
- context builder

### Fase 5 — LLM adapter

- conexión opcional
- validación del output
- confirmación de acción

### Fase 6 — RAG local

- documentación y términos
- respuestas educativas más útiles

---

## 17. Conclusión

La IA de Omega Markets debe ser:

- contextual
- basada en datos reales
- protegida por guardrails
- útil sin depender de un LLM externo
- capaz de sugerir acciones con confirmación
- validada por Zod
- extensible sin sobreingeniería

La IA debe ayudar a interpretar el estado del portafolio, del mercado y del riesgo, no sustituir la comprensión del usuario ni ejecutar cambios sin control.
