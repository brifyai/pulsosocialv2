# Arquitectura del Sistema

## Visión General

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CAPA DE PRESENTACIÓN                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │   Web App       │  │   Admin Panel   │  │   AI Town (explorador)      │  │
│  │   (Next.js)     │  │   (Dashboard)   │  │   (Visualización agentes)   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CAPA DE TIEMPO REAL (Convex)                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │   Sesiones      │  │   Activación    │  │   Eventos de encuesta       │  │
│  │   Activas       │  │   de Estudios   │  │   en ejecución              │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CAPA DE PERSISTENCIA (Supabase)                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         PostgreSQL Database                              ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  ││
│  │  │ agents       │  │ agent_traits │  │ agent_memory │  │ events     │  ││
│  │  │ (perfiles)   │  │ (rasgos)     │  │ (historial)  │  │ (noticias) │  ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  ││
│  │  │ surveys      │  │ survey_runs  │  │ benchmarks   │  │ calibration│  ││
│  │  │ (encuestas)  │  │ (respuestas) │  │ (reales)     │  │ (ajustes)  │  ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CAPA DE PROCESAMIENTO (Python)                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │   ETL           │  │   Población     │  │   Calibración               │  │
│  │   (Censo/CASEN) │  │   Sintética     │  │   (vs benchmarks)           │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │   Validación    │  │   Análisis      │  │   Scoring de                │  │
│  │   (métricas)    │  │   agregados     │  │   exposición                │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SERVICIOS EXTERNOS                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │   LLM (Groq/    │  │   Embeddings    │  │   APIs de                   │  │
│  │   Ollama)       │  │   (opcional)    │  │   noticias                  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Stack Tecnológico

### Mantener (de AI Town existente)
| Componente | Tecnología | Uso |
|------------|-----------|-----|
| Frontend base | React + Vite | UI del juego/explorador |
| Tiempo real | Convex | Sincronización en vivo |
| LLM | Configurable | Generación de texto natural |

### Agregar
| Componente | Tecnología | Uso |
|------------|-----------|-----|
| Base de datos principal | Supabase (PostgreSQL) | Persistencia de agentes, memoria, resultados |
| ETL y calibración | Python + pandas | Procesamiento de datos censales |
| Población sintética | Python + numpy | Generación de agentes representativos |
| Validación | Python + scipy | Comparación con benchmarks |
| Visualización | Recharts / D3 | Gráficos de resultados |

## Reparto de Responsabilidades

### Convex (Tiempo Real)
**Qué hace:**
- Gestión de sesiones activas de usuarios
- Activación de estudios/encuestas en tiempo real
- Sincronización de estado temporal de agentes activos
- Eventos de encuesta en ejecución
- Comunicación con el frontend

**Qué NO hace:**
- Almacenamiento permanente de perfiles de agentes
- Memoria a largo plazo
- Resultados históricos de encuestas
- Calibración

**Funciones principales:**
```typescript
// convex/surveys.ts
- activateSurvey(surveyId, sampleSize)
- getActiveSurveyState()
- submitAgentResponse(agentId, questionId, response)

// convex/agents.ts  
- getActiveAgentState(agentId)
- updateAgentFatigue(agentId, fatigueLevel)

// convex/events.ts
- broadcastEventToActiveAgents(eventId)
- getLiveEventStatus()
```

### Supabase/PostgreSQL (Persistencia)
**Qué hace:**
- Almacenamiento de perfiles completos de agentes
- Rasgos de personalidad persistentes
- Memoria resumida y historial
- Respuestas históricas a encuestas
- Eventos validados y noticias
- Benchmarks reales (Cadem, CEP, etc.)
- Auditoría y trazabilidad
- Versionado de estudios

**Esquema principal:**
```sql
-- Ver data_model.md para schema completo
agents (id, region, comuna, age, sex, education, income_decile, weight)
agent_traits (agent_id, institutional_trust, risk_aversion, ...)
agent_memory (agent_id, summary, salient_topics, updated_at)
events (id, title, topic, source, confidence_score, summary)
surveys (id, name, survey_type, benchmark_source)
survey_responses (run_id, agent_id, question_code, answer_raw)
benchmarks (id, source_name, results_json)
```

### Python (Procesamiento)
**Qué hace:**
- ETL de datos censales (Censo 2024, CASEN, SUBTEL)
- Generación de población sintética por celdas
- Calibración contra benchmarks reales
- Scoring de exposición a eventos
- Análisis agregados y métricas de validación

**Módulos principales:**
```python
# python/etl/census_loader.py
- load_censo_2024()
- load_casen()
- load_subtel()

# python/synthetic_population/generator.py
- generate_population(target_size)
- assign_demographic_weights()
- create_agent_profiles()

# python/calibration/validator.py
- compare_with_cadem(synthetic_results, cadem_results)
- calculate_error_metrics()
- generate_calibration_report()
```

### Servicios de Encuestas (Survey Engine)
**Qué hace:**
- Ejecución de encuestas a agentes
- Cálculo estructurado de respuestas
- Generación de texto natural (LLM) solo para expresión
- Validación de consistencia

**Flujo de respuesta:**
```
1. Cargar perfil del agente (Supabase)
2. Cargar rasgos de personalidad
3. Cargar memoria resumida
4. Cargar eventos expuestos
5. Calcular probabilidad estructurada
6. Convertir a categoría de respuesta
7. (Opcional) LLM genera texto natural
8. Guardar respuesta con trazabilidad
```

## Flujo de Datos

### Creación de Población Sintética
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Censo 2024  │────▶│    ETL      │────▶│   Celdas    │
│   CASEN     │     │   Python    │     │   demo-     │
│   SUBTEL    │     │             │     │   gráficas  │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Supabase   │◀────│  Asignar    │◀────│  Generar    │
│  (agents)   │     │   rasgos    │     │  agentes    │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Ejecución de Encuesta Sintética
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Usuario   │────▶│   Convex    │────▶│   Survey    │
│   crea      │     │   (activa)  │     │   Engine    │
│   encuesta  │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Supabase   │◀────│   Guardar   │◀────│  Calcular   │
│ (respuestas)│     │  respuestas │     │  respuestas │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Calibración con Benchmarks
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Cadem/CEP  │────▶│   Python    │────▶│   Métricas  │
│  (resultados│     │  Validator  │     │   de error  │
│   reales)   │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Supabase   │◀────│   Ajustar   │◀────│  Generar    │
│ (calibration)│    │  parámetros │     │  reporte    │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Variables de Entorno

### Convex (.env.local)
```bash
VITE_CONVEX_URL=https://tu-deployment.convex.cloud
VITE_SUPABASE_URL=https://tu-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# LLM (Groq recomendado para producción)
GROQ_API_KEY=your-groq-key
LLM_MODEL=llama3-8b-8192

# Opcional: Replicate para música
REPLICATE_API_TOKEN=your-token
```

### Python (.env en carpeta python/)
```bash
SUPABASE_URL=https://tu-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# Para ingesta de datos
INE_API_URL=optional
CADEM_API_URL=optional
```

## Seguridad

### Acceso a Datos
- Supabase: RLS (Row Level Security) habilitado
- Convex: Autenticación opcional (Clerk deshabilitado por defecto)
- Python: Service key solo para scripts de ETL

### Protección de Datos Sintéticos
- No almacenar PII (información personalmente identificable)
- Agentes son entidades sintéticas, no personas reales
- Logs de auditoría para todas las operaciones

## Escalabilidad

### Estrategia de Costos
| Componente | Estrategia |
|------------|------------|
| Agentes | Dormidos en Supabase, activación por estudio |
| LLM | Solo para expresión, no para decisiones |
| Embeddings | Batch processing, caching |
| Convex | Solo sesiones activas |

### Límites Objetivo
- 10.000 agentes en base de datos
- 100-500 agentes activos simultáneos
- 1.000 respuestas por minuto
- < $200/mes en costos de infraestructura (V1)

## Monitoreo

### Métricas a Trackear
- Tiempo promedio de respuesta por agente
- Tasa de error vs benchmarks
- Costo por encuesta ejecutada
- Agentes activos vs dormidos
- Uso de tokens LLM

### Alertas
- Error > 10% vs benchmark
- Costo por encuesta > $X
- Tiempo de respuesta > Y segundos