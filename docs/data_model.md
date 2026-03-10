# Modelo de Datos

## Visión General

El modelo de datos está diseñado para soportar:
- 10.000 agentes sintéticos con perfiles demográficos y rasgos
- Memoria persistente y resumida por agente
- Eventos/noticias estructuradas con exposición calculada
- Encuestas sintéticas con trazabilidad completa
- Benchmarks reales para validación
- Calibración histórica de parámetros

## Diagrama Entidad-Relación

```
┌──────────────────┐       ┌──────────────────┐
│     agents       │       │     events       │
│──────────────────│       │──────────────────│
│ id (PK)          │       │ id (PK)          │
│ region           │       │ title            │
│ comuna           │       │ topic            │
│ urban_rural      │       │ territory        │
│ sex              │       │ source           │
│ age              │       │ source_type      │
│ education        │       │ confidence_score │
│ income_decile    │       │ event_date       │
│ occupation       │       │ summary          │
│ household_type   │       │ metadata_json    │
│ connectivity     │       └────────┬─────────┘
│ weight           │                │
└────────┬─────────┘               │
         │                         │
         │1:N                      │1:N
         │                         │
         ▼                         ▼
┌──────────────────┐       ┌──────────────────┐
│  agent_traits    │       │agent_event_exposure│
│──────────────────│       │──────────────────│
│ agent_id (FK)    │       │ agent_id (FK)    │
│ institutional_   │       │ event_id (FK)    │
│   trust          │       │ exposure_prob    │
│ risk_aversion    │       │ exposure_level   │
│ digital_lit      │       │ interpreted_     │
│ patience         │       │   stance         │
│ civic_interest   │       └──────────────────┘
│ social_desirability│
│ openness_change  │
│ ideology_score   │
│ nationalism_score│
└──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│  agent_memory    │       │    surveys       │
│──────────────────│       │──────────────────│
│ agent_id (PK,FK) │       │ id (PK)          │
│ summary          │       │ name             │
│ salient_topics   │       │ description      │
│ previous_        │       │ survey_type      │
│   positions      │       │ benchmark_source │
│ contradiction_   │       │ field_date       │
│   score          │       │ version          │
│ updated_at       │       └────────┬─────────┘
└──────────────────┘                │
                                    │1:N
┌──────────────────┐                │
│  agent_state     │                ▼
│──────────────────│       ┌──────────────────┐
│ agent_id (PK,FK) │       │ survey_questions │
│ fatigue          │       │──────────────────│
│ economic_stress  │       │ id (PK)          │
│ mood             │       │ survey_id (FK)   │
│ survey_          │       │ question_code    │
│   saturation     │       │ question_text    │
│ last_activation  │       │ answer_type      │
└──────────────────┘       │ options_json     │
                           │ order_index      │
                           └────────┬─────────┘
                                    │
                                    │1:N
                                    ▼
                           ┌──────────────────┐
                           │   survey_runs    │
                           │──────────────────│
                           │ id (PK)          │
                           │ survey_id (FK)   │
                           │ run_type         │
                           │ sample_size      │
                           │ created_at       │
                           │ benchmark_id (FK)│
                           └────────┬─────────┘
                                    │
                                    │1:N
                                    ▼
                           ┌──────────────────┐
                           │ survey_responses │
                           │──────────────────│
                           │ id (PK)          │
                           │ run_id (FK)      │
                           │ agent_id (FK)    │
                           │ question_code    │
                           │ answer_raw       │
                           │ answer_structured│
                           │ confidence       │
                           │ response_time_ms │
                           └──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│   benchmarks     │       │ calibration_runs │
│──────────────────│       │──────────────────│
│ id (PK)          │       │ id (PK)          │
│ source_name      │       │ benchmark_id (FK)│
│ source_wave      │       │ model_version    │
│ field_date       │       │ metrics_json     │
│ methodology_json │       │ parameter_snapshot│
│ results_json     │       │ created_at       │
└──────────────────┘       └──────────────────┘
```

---

## Schema SQL Completo (Supabase/PostgreSQL)

```sql
-- ============================================================================
-- EXTENSIONES
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Para búsqueda de texto
CREATE EXTENSION IF NOT EXISTS "vector";   -- Para embeddings (opcional)

-- ============================================================================
-- TABLA: agents
-- Descripción: Perfiles demográficos de agentes sintéticos
-- ============================================================================

CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Demografía básica
    region VARCHAR(100) NOT NULL,
    comuna VARCHAR(100) NOT NULL,
    urban_rural VARCHAR(20) CHECK (urban_rural IN ('urbano', 'rural')),
    sex VARCHAR(20) CHECK (sex IN ('femenino', 'masculino', 'otro')),
    age INTEGER CHECK (age >= 18 AND age <= 100),
    
    -- Socioeconomía
    education VARCHAR(50) CHECK (education IN (
        'sin_estudios', 'basica_completa', 'media_incompleta', 
        'media_completa', 'tecnica_completa', 'universitaria_completa'
    )),
    income_decile INTEGER CHECK (income_decile >= 1 AND income_decile <= 10),
    occupation VARCHAR(100),
    
    -- Hogar
    household_type VARCHAR(50) CHECK (household_type IN (
        'unipersonal', 'pareja_sin_hijos', 'pareja_con_hijos',
        'monoparental', 'extendido', 'compuesto'
    )),
    
    -- Conectividad
    connectivity_type VARCHAR(50) CHECK (connectivity_type IN (
        'solo_movil', 'movil_fija', 'solo_fija', 'sin_conexion',
        'banda_ancha_movil'
    )),
    
    -- Peso de expansión (para representar población real)
    weight DECIMAL(10, 4) DEFAULT 1.0,
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Índices
CREATE INDEX idx_agents_region ON agents(region);
CREATE INDEX idx_agents_comuna ON agents(comuna);
CREATE INDEX idx_agents_age ON agents(age);
CREATE INDEX idx_agents_sex ON agents(sex);
CREATE INDEX idx_agents_education ON agents(education);
CREATE INDEX idx_agents_income_decile ON agents(income_decile);

-- ============================================================================
-- TABLA: agent_traits
-- Descripción: Rasgos de personalidad y predisposiciones
-- ============================================================================

CREATE TABLE agent_traits (
    agent_id UUID PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Rasgos institucionales (0-1)
    institutional_trust DECIMAL(5, 4) CHECK (institutional_trust BETWEEN 0 AND 1),
    
    -- Rasgos de riesgo (0-1)
    risk_aversion DECIMAL(5, 4) CHECK (risk_aversion BETWEEN 0 AND 1),
    
    -- Alfabetización digital (0-1)
    digital_literacy DECIMAL(5, 4) CHECK (digital_literacy BETWEEN 0 AND 1),
    
    -- Paciencia en interacciones (0-1)
    patience DECIMAL(5, 4) CHECK (patience BETWEEN 0 AND 1),
    
    -- Interés en temas cívicos (0-1)
    civic_interest DECIMAL(5, 4) CHECK (civic_interest BETWEEN 0 AND 1),
    
    -- Tendencia a dar respuestas socialmente deseables (0-1)
    social_desirability DECIMAL(5, 4) CHECK (social_desirability BETWEEN 0 AND 1),
    
    -- Apertura al cambio (0-1)
    openness_to_change DECIMAL(5, 4) CHECK (openness_to_change BETWEEN 0 AND 1),
    
    -- Orientación ideológica (0 = izquierda, 1 = derecha)
    ideology_score DECIMAL(5, 4) CHECK (ideology_score BETWEEN 0 AND 1),
    
    -- Nacionalismo (0 = cosmopolita, 1 = nacionalista)
    nationalism_score DECIMAL(5, 4) CHECK (nationalism_score BETWEEN 0 AND 1),
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_traits_ideology ON agent_traits(ideology_score);
CREATE INDEX idx_agent_traits_trust ON agent_traits(institutional_trust);

-- ============================================================================
-- TABLA: agent_memory
-- Descripción: Memoria resumida y posiciones históricas del agente
-- ============================================================================

CREATE TABLE agent_memory (
    agent_id UUID PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Resumen narrativo de la memoria del agente
    summary TEXT,
    
    -- Temas más importantes para el agente (array de strings)
    salient_topics TEXT[],
    
    -- Posiciones anteriores en temas clave (JSON)
    -- Ej: {"economia": "negativa", "gobierno": "neutral"}
    previous_positions JSONB DEFAULT '{}',
    
    -- Score de contradicción (cuánto ha variado en sus posiciones)
    contradiction_score DECIMAL(5, 4) DEFAULT 0 CHECK (contradiction_score BETWEEN 0 AND 1),
    
    -- Metadatos
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    memory_version INTEGER DEFAULT 1
);

-- ============================================================================
-- TABLA: agent_state
-- Descripción: Estado temporal del agente (fatiga, estrés, etc.)
-- ============================================================================

CREATE TABLE agent_state (
    agent_id UUID PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Fatiga acumulada por encuestas (0 = fresco, 1 = agotado)
    fatigue DECIMAL(5, 4) DEFAULT 0 CHECK (fatigue BETWEEN 0 AND 1),
    
    -- Estrés económico percibido (0-1)
    economic_stress DECIMAL(5, 4) DEFAULT 0.5,
    
    -- Estado de ánimo (0 = negativo, 1 = positivo)
    mood DECIMAL(5, 4) DEFAULT 0.5,
    
    -- Saturación de encuestas (cuántas ha respondido recientemente)
    survey_saturation INTEGER DEFAULT 0,
    
    -- Última vez que fue activado
    last_activation_at TIMESTAMPTZ,
    
    -- Metadatos
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_state_last_activation ON agent_state(last_activation_at);

-- ============================================================================
-- TABLA: events
-- Descripción: Eventos noticiosos y noticias validadas
-- ============================================================================

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Información básica
    title VARCHAR(500) NOT NULL,
    topic VARCHAR(100) NOT NULL,
    
    -- Territorio afectado
    territory VARCHAR(100),  -- región, comuna, o 'nacional'
    
    -- Fuente
    source VARCHAR(200) NOT NULL,
    source_type VARCHAR(50) CHECK (source_type IN (
        'oficial', 'prensa_nacional', 'prensa_regional', 
        'think_tank', 'internacional', 'redes_sociales'
    )),
    
    -- Score de confianza (0-1)
    confidence_score DECIMAL(5, 4) CHECK (confidence_score BETWEEN 0 AND 1),
    
    -- Fecha del evento
    event_date TIMESTAMPTZ NOT NULL,
    
    -- Resumen estructurado
    summary TEXT NOT NULL,
    
    -- Metadatos adicionales
    metadata_json JSONB DEFAULT '{}',
    
    -- Metadatos de sistema
    created_at TIMESTAMPTZ DEFAULT NOW(),
    validated BOOLEAN DEFAULT FALSE,
    validated_by VARCHAR(100)
);

CREATE INDEX idx_events_topic ON events(topic);
CREATE INDEX idx_events_territory ON events(territory);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_source_type ON events(source_type);

-- Búsqueda full-text
CREATE INDEX idx_events_title_search ON events USING gin(title gin_trgm_ops);

-- ============================================================================
-- TABLA: agent_event_exposure
-- Descripción: Exposición calculada de agentes a eventos
-- ============================================================================

CREATE TABLE agent_event_exposure (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    -- Probabilidad de exposición (0-1) basada en perfil
    exposure_probability DECIMAL(5, 4) CHECK (exposure_probability BETWEEN 0 AND 1),
    
    -- Nivel de exposición calculado (0 = no expuesto, 1 = muy expuesto)
    exposure_level DECIMAL(5, 4) DEFAULT 0,
    
    -- Interpretación de la postura del agente hacia el evento
    interpreted_stance VARCHAR(50) CHECK (interpreted_stance IN (
        'favorable', 'desfavorable', 'neutral', 'desconoce'
    )),
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(agent_id, event_id)
);

CREATE INDEX idx_exposure_agent ON agent_event_exposure(agent_id);
CREATE INDEX idx_exposure_event ON agent_event_exposure(event_id);

-- ============================================================================
-- TABLA: surveys
-- Descripción: Definición de encuestas
-- ============================================================================

CREATE TABLE surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Información básica
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Tipo de encuesta
    survey_type VARCHAR(50) CHECK (survey_type IN (
        'coyuntura', 'aprobacion', 'evaluacion_pais', 
        'economia', 'evento_especifico', 'test_cuestionario'
    )),
    
    -- Fuente de benchmark para comparar (opcional)
    benchmark_source VARCHAR(100),
    
    -- Fecha de trabajo de campo
    field_date DATE,
    
    -- Versión del instrumento
    version VARCHAR(20) DEFAULT '1.0',
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_surveys_type ON surveys(survey_type);
CREATE INDEX idx_surveys_active ON surveys(is_active);

-- ============================================================================
-- TABLA: survey_questions
-- Descripción: Preguntas de encuestas
-- ============================================================================

CREATE TABLE survey_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    
    -- Código único para la pregunta (ej: "aprueba_boric")
    question_code VARCHAR(100) NOT NULL,
    
    -- Texto completo de la pregunta
    question_text TEXT NOT NULL,
    
    -- Tipo de respuesta
    answer_type VARCHAR(50) CHECK (answer_type IN (
        'yes_no', 'scale_1_7', 'scale_1_5', 'scale_1_10',
        'multiple_choice', 'ranking', 'open_short'
    )),
    
    -- Opciones (JSON según tipo)
    -- Ej scale: {"min": 1, "max": 7, "min_label": "Muy malo", "max_label": "Muy bueno"}
    -- Ej multiple: {"options": ["Aprueba", "Desaprueba", "Ns/Nc"]}
    options_json JSONB,
    
    -- Orden de aparición
    order_index INTEGER NOT NULL,
    
    -- Benchmark reference (opcional)
    benchmark_question_code VARCHAR(100),
    
    UNIQUE(survey_id, question_code)
);

CREATE INDEX idx_questions_survey ON survey_questions(survey_id);
CREATE INDEX idx_questions_code ON survey_questions(question_code);

-- ============================================================================
-- TABLA: survey_runs
-- Descripción: Ejecuciones de encuestas
-- ============================================================================

CREATE TABLE survey_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    
    -- Tipo de ejecución
    run_type VARCHAR(50) CHECK (run_type IN (
        'completa', 'muestra', 'segmento', 'calibracion'
    )),
    
    -- Tamaño de muestra
    sample_size INTEGER NOT NULL,
    
    -- Benchmark asociado (opcional)
    benchmark_id UUID REFERENCES benchmarks(id),
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 'running', 'completed', 'error', 'cancelled'
    )),
    completed_at TIMESTAMPTZ,
    
    -- Snapshot de parámetros usados
    model_parameters JSONB DEFAULT '{}'
);

CREATE INDEX idx_runs_survey ON survey_runs(survey_id);
CREATE INDEX idx_runs_status ON survey_runs(status);
CREATE INDEX idx_runs_created ON survey_runs(created_at);

-- ============================================================================
-- TABLA: survey_responses
-- Descripción: Respuestas individuales de agentes
-- ============================================================================

CREATE TABLE survey_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL REFERENCES survey_runs(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Referencia a la pregunta
    question_code VARCHAR(100) NOT NULL,
    
    -- Respuesta raw (texto o valor)
    answer_raw TEXT,
    
    -- Respuesta estructurada para análisis
    -- Ej: {"selected_option": "desaprueba", "score": 0.74}
    answer_structured_json JSONB,
    
    -- Confianza en la respuesta (0-1)
    confidence DECIMAL(5, 4),
    
    -- Tiempo de respuesta en ms
    response_time_ms INTEGER,
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_responses_run ON survey_responses(run_id);
CREATE INDEX idx_responses_agent ON survey_responses(agent_id);
CREATE INDEX idx_responses_question ON survey_responses(question_code);

-- Índice compuesto para consultas agregadas
CREATE INDEX idx_responses_run_question ON survey_responses(run_id, question_code);

-- ============================================================================
-- TABLA: benchmarks
-- Descripción: Resultados de encuestas reales para validación
-- ============================================================================

CREATE TABLE benchmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Información de la fuente
    source_name VARCHAR(100) NOT NULL,  -- ej: "Cadem", "CEP", "Pulso Ciudadano"
    source_wave VARCHAR(50),            -- ej: "Enero 2025", "Estudio 45"
    
    -- Fecha de trabajo de campo
    field_date DATE,
    
    -- Metodología
    methodology_json JSONB,
    -- Ej: {"sample_size": 1200, "margin_of_error": 3.1, "method": "telefonica"}
    
    -- Resultados
    results_json JSONB NOT NULL,
    -- Ej: {"aprueba_boric": {"aprueba": 0.35, "desaprueba": 0.55, "ns_nc": 0.10}}
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    imported_by VARCHAR(100)
);

CREATE INDEX idx_benchmarks_source ON benchmarks(source_name);
CREATE INDEX idx_benchmarks_date ON benchmarks(field_date);

-- ============================================================================
-- TABLA: calibration_runs
-- Descripción: Ejecuciones de calibración del modelo
-- ============================================================================

CREATE TABLE calibration_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Benchmark usado para calibrar
    benchmark_id UUID REFERENCES benchmarks(id),
    
    -- Versión del modelo
    model_version VARCHAR(50) NOT NULL,
    
    -- Métricas de desempeño
    metrics_json JSONB NOT NULL,
    -- Ej: {"mae": 0.045, "rmse": 0.062, "max_error": 0.12}
    
    -- Snapshot de parámetros calibrados
    parameter_snapshot JSONB NOT NULL,
    -- Ej: {"ideology_weight": 0.7, "trust_modifier": 0.3}
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    is_current BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_calibration_benchmark ON calibration_runs(benchmark_id);
CREATE INDEX idx_calibration_current ON calibration_runs(is_current);

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista: Distribución demográfica de agentes
CREATE VIEW v_agent_demographics AS
SELECT 
    region,
    sex,
    CASE 
        WHEN age BETWEEN 18 AND 29 THEN '18-29'
        WHEN age BETWEEN 30 AND 44 THEN '30-44'
        WHEN age BETWEEN 45 AND 64 THEN '45-64'
        ELSE '65+'
    END AS age_group,
    education,
    income_decile,
    COUNT(*) AS count,
    SUM(weight) AS weighted_count
FROM agents
GROUP BY region, sex, age_group, education, income_decile;

-- Vista: Resultados agregados por encuesta
CREATE VIEW v_survey_results AS
SELECT 
    sr.run_id,
    s.name AS survey_name,
    sr.question_code,
    sq.question_text,
    COUNT(*) AS response_count,
    AVG((sr.answer_structured_json->>'score')::DECIMAL) AS avg_score,
    AVG(sr.confidence) AS avg_confidence
FROM survey_responses sr
JOIN survey_runs sru ON sr.run_id = sru.id
JOIN surveys s ON sru.survey_id = s.id
JOIN survey_questions sq ON sru.survey_id = sq.survey_id AND sr.question_code = sq.question_code
GROUP BY sr.run_id, s.name, sr.question_code, sq.question_text;

-- ============================================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================================

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_traits_updated_at BEFORE UPDATE ON agent_traits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_memory_updated_at BEFORE UPDATE ON agent_memory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función: Decaer fatiga con el tiempo
CREATE OR REPLACE FUNCTION decay_agent_fatigue()
RETURNS VOID AS $$
BEGIN
    UPDATE agent_state
    SET fatigue = GREATEST(0, fatigue - 0.1),
        updated_at = NOW()
    WHERE last_activation_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar según necesidades)
CREATE POLICY "Public read access to agents" ON agents
    FOR SELECT USING (TRUE);

CREATE POLICY "Service role full access to agents" ON agents
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Public read access to events" ON events
    FOR SELECT USING (validated = TRUE);

CREATE POLICY "Service role full access" ON survey_responses
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- SEMILLA INICIAL (datos básicos de regiones chilenas)
-- ============================================================================

INSERT INTO agents (region, comuna, urban_rural, sex, age, education, income_decile)
VALUES 
    ('Metropolitana', 'Santiago', 'urbano', 'femenino', 35, 'universitaria_completa', 7),
    ('Metropolitana', 'Puente Alto', 'urbano', 'masculino', 45, 'media_completa', 5),
    ('Valparaíso', 'Viña del Mar', 'urbano', 'femenino', 28, 'tecnica_completa', 6),
    ('Biobío', 'Concepción', 'urbano', 'masculino', 52, 'universitaria_completa', 8),
    ('Araucanía', 'Temuco', 'rural', 'femenino', 38, 'media_completa', 4)
ON CONFLICT DO NOTHING;
```

---

## Tipos TypeScript

```typescript
// types/agent.ts

export interface Agent {
  id: string;
  region: string;
  comuna: string;
  urban_rural: 'urbano' | 'rural';
  sex: 'femenino' | 'masculino' | 'otro';
  age: number;
  education: EducationLevel;
  income_decile: number;
  occupation?: string;
  household_type: HouseholdType;
  connectivity_type: ConnectivityType;
  weight: number;
  created_at: string;
  updated_at: string;
}

export type EducationLevel =
  | 'sin_estudios'
  | 'basica_completa'
  | 'media_incompleta'
  | 'media_completa'
  | 'tecnica_completa'
  | 'universitaria_completa';

export type HouseholdType =
  | 'unipersonal'
  | 'pareja_sin_hijos'
  | 'pareja_con_hijos'
  | 'monoparental'
  | 'extendido'
  | 'compuesto';

export type ConnectivityType =
  | 'solo_movil'
  | 'movil_fija'
  | 'solo_fija'
  | 'sin_conexion'
  | 'banda_ancha_movil';

export interface AgentTraits {
  agent_id: string;
  institutional_trust: number;
  risk_aversion: number;
  digital_literacy: number;
  patience: number;
  civic_interest: number;
  social_desirability: number;
  openness_to_change: number;
  ideology_score: number;
  nationalism_score: number;
}

export interface AgentMemory {
  agent_id: string;
  summary: string;
  salient_topics: string[];
  previous_positions: Record<string, string>;
  contradiction_score: number;
  updated_at: string;
}

export interface AgentState {
  agent_id: string;
  fatigue: number;
  economic_stress: number;
  mood: number;
  survey_saturation: number;
  last_activation_at: string | null;
}

export interface AgentFull {
  profile: Agent;
  traits: AgentTraits;
  memory: AgentMemory;
  state: AgentState;
}

// types/survey.ts

export type AnswerType =
  | 'yes_no'
  | 'scale_1_7'
  | 'scale_1_5'
  | 'scale_1_10'
  | 'multiple_choice'
  | 'ranking'
  | 'open_short';

export interface Survey {
  id: string;
  name: string;
  description?: string;
  survey_type: SurveyType;
  benchmark_source?: string;
  field_date?: string;
  version: string;
  created_at: string;
  is_active: boolean;
}

export type SurveyType =
  | 'coyuntura'
  | 'aprobacion'
  | 'evaluacion_pais'
  | 'economia'
  | 'evento_especifico'
  | 'test_cuestionario';

export interface SurveyQuestion {
  id: string;
  survey_id: string;
  question_code: string;
  question_text: string;
  answer_type: AnswerType;
  options_json?: Record<string, unknown>;
  order_index: number;
  benchmark_question_code?: string;
}

export interface SurveyRun {
  id: string;
  survey_id: string;
  run_type: 'completa' | 'muestra' | 'segmento' | 'calibracion';
  sample_size: number;
  benchmark_id?: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled';
  created_at: string;
  completed_at?: string;
  model_parameters: Record<string, unknown>;
}

export interface SurveyResponse {
  id: string;
  run_id: string;
  agent_id: string;
  question_code: string;
  answer_raw: string;
  answer_structured_json: Record<string, unknown>;
  confidence: number;
  response_time_ms: number;
  created_at: string;
}

// types/event.ts

export type SourceType =
  | 'oficial'
  | 'prensa_nacional'
  | 'prensa_regional'
  | 'think_tank'
  | 'internacional'
  | 'redes_sociales';

export interface Event {
  id: string;
  title: string;
  topic: string;
  territory?: string;
  source: string;
  source_type: SourceType;
  confidence_score: number;
  event_date: string;
  summary: string;
  metadata_json: Record<string, unknown>;
  validated: boolean;
  validated_by?: string;
}

export interface AgentEventExposure {
  agent_id: string;
  event_id: string;
  exposure_probability: number;
  exposure_level: number;
  interpreted_stance: 'favorable' | 'desfavorable' | 'neutral' | 'desconoce';
}

// types/benchmark.ts

export interface Benchmark {
  id: string;
  source_name: string;
  source_wave?: string;
  field_date?: string;
  methodology_json: Record<string, unknown>;
  results_json: Record<string, unknown>;
  created_at: string;
}

export interface CalibrationRun {
  id: string;
  benchmark_id?: string;
  model_version: string;
  metrics_json: Record<string, unknown>;
  parameter_snapshot: Record<string, unknown>;
  created_at: string;
  is_current: boolean;
}

// types/survey-engine.ts

/**
 * Respuesta estructurada del motor de encuestas
 */
export interface StructuredSurveyResponse {
  question_code: string;
  selected_option: string;
  score: number;
  confidence: number;
  reason: string;
  agent_id: string;
  run_id: string;
}

/**
 * Input para el motor de respuesta
 */
export interface ResponseEngineInput {
  agent: AgentFull;
  question: SurveyQuestion;
  exposedEvents: Event[];
  context: Record<string, unknown>;
}
```

---

## Reglas de Validación

### Agents
- `age` debe estar entre 18 y 100
- `income_decile` debe estar entre 1 y 10
- `weight` debe ser positivo
- Combinación `region` + `comuna` debe ser válida (validar contra lista oficial)

### Agent Traits
- Todos los scores deben estar entre 0 y 1
- `ideology_score`: 0 = izquierda extrema, 0.5 = centro, 1 = derecha extrema

### Survey Responses
- `confidence` debe estar entre 0 y 1
- `answer_structured_json` debe tener schema válido según `answer_type`

### Events
- `confidence_score` debe estar entre 0 y 1
- `source_type` debe ser válido
- Evento debe estar `validated = true` para ser público