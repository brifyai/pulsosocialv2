-- ============================================================================
-- PANEL SINTETICO CHILE - Schema Inicial
-- Migration: 001_initial_schema
-- Descripción: Tablas base para agentes, encuestas, eventos y validación
-- ============================================================================

-- ============================================================================
-- EXTENSIONES
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- TABLA: agents
-- ============================================================================

CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    region VARCHAR(100) NOT NULL,
    comuna VARCHAR(100) NOT NULL,
    urban_rural VARCHAR(20) CHECK (urban_rural IN ('urbano', 'rural')),
    sex VARCHAR(20) CHECK (sex IN ('femenino', 'masculino', 'otro')),
    age INTEGER CHECK (age >= 18 AND age <= 100),
    
    education VARCHAR(50) CHECK (education IN (
        'sin_estudios', 'basica_completa', 'media_incompleta', 
        'media_completa', 'tecnica_completa', 'universitaria_completa'
    )),
    income_decile INTEGER CHECK (income_decile >= 1 AND income_decile <= 10),
    occupation VARCHAR(100),
    
    household_type VARCHAR(50) CHECK (household_type IN (
        'unipersonal', 'pareja_sin_hijos', 'pareja_con_hijos',
        'monoparental', 'extendido', 'compuesto'
    )),
    
    connectivity_type VARCHAR(50) CHECK (connectivity_type IN (
        'solo_movil', 'movil_fija', 'solo_fija', 'sin_conexion',
        'banda_ancha_movil'
    )),
    
    weight DECIMAL(10, 4) DEFAULT 1.0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_agents_region ON agents(region);
CREATE INDEX IF NOT EXISTS idx_agents_comuna ON agents(comuna);
CREATE INDEX IF NOT EXISTS idx_agents_age ON agents(age);
CREATE INDEX IF NOT EXISTS idx_agents_sex ON agents(sex);
CREATE INDEX IF NOT EXISTS idx_agents_education ON agents(education);
CREATE INDEX IF NOT EXISTS idx_agents_income_decile ON agents(income_decile);

-- ============================================================================
-- TABLA: agent_traits
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_traits (
    agent_id UUID PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
    
    institutional_trust DECIMAL(5, 4) CHECK (institutional_trust BETWEEN 0 AND 1),
    risk_aversion DECIMAL(5, 4) CHECK (risk_aversion BETWEEN 0 AND 1),
    digital_literacy DECIMAL(5, 4) CHECK (digital_literacy BETWEEN 0 AND 1),
    patience DECIMAL(5, 4) CHECK (patience BETWEEN 0 AND 1),
    civic_interest DECIMAL(5, 4) CHECK (civic_interest BETWEEN 0 AND 1),
    social_desirability DECIMAL(5, 4) CHECK (social_desirability BETWEEN 0 AND 1),
    openness_to_change DECIMAL(5, 4) CHECK (openness_to_change BETWEEN 0 AND 1),
    ideology_score DECIMAL(5, 4) CHECK (ideology_score BETWEEN 0 AND 1),
    nationalism_score DECIMAL(5, 4) CHECK (nationalism_score BETWEEN 0 AND 1),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_traits_ideology ON agent_traits(ideology_score);
CREATE INDEX IF NOT EXISTS idx_agent_traits_trust ON agent_traits(institutional_trust);

-- ============================================================================
-- TABLA: agent_memory
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_memory (
    agent_id UUID PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
    
    summary TEXT,
    salient_topics TEXT[],
    previous_positions JSONB DEFAULT '{}',
    contradiction_score DECIMAL(5, 4) DEFAULT 0 CHECK (contradiction_score BETWEEN 0 AND 1),
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    memory_version INTEGER DEFAULT 1
);

-- ============================================================================
-- TABLA: agent_state
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_state (
    agent_id UUID PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
    
    fatigue DECIMAL(5, 4) DEFAULT 0 CHECK (fatigue BETWEEN 0 AND 1),
    economic_stress DECIMAL(5, 4) DEFAULT 0.5,
    mood DECIMAL(5, 4) DEFAULT 0.5,
    survey_saturation INTEGER DEFAULT 0,
    last_activation_at TIMESTAMPTZ,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_state_last_activation ON agent_state(last_activation_at);

-- ============================================================================
-- TABLA: events
-- ============================================================================

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    title VARCHAR(500) NOT NULL,
    topic VARCHAR(100) NOT NULL,
    territory VARCHAR(100),
    
    source VARCHAR(200) NOT NULL,
    source_type VARCHAR(50) CHECK (source_type IN (
        'oficial', 'prensa_nacional', 'prensa_regional', 
        'think_tank', 'internacional', 'redes_sociales'
    )),
    
    confidence_score DECIMAL(5, 4) CHECK (confidence_score BETWEEN 0 AND 1),
    event_date TIMESTAMPTZ NOT NULL,
    summary TEXT NOT NULL,
    metadata_json JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    validated BOOLEAN DEFAULT FALSE,
    validated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_events_topic ON events(topic);
CREATE INDEX IF NOT EXISTS idx_events_territory ON events(territory);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_source_type ON events(source_type);
CREATE INDEX IF NOT EXISTS idx_events_title_search ON events USING gin(title gin_trgm_ops);

-- ============================================================================
-- TABLA: agent_event_exposure
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_event_exposure (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    exposure_probability DECIMAL(5, 4) CHECK (exposure_probability BETWEEN 0 AND 1),
    exposure_level DECIMAL(5, 4) DEFAULT 0,
    interpreted_stance VARCHAR(50) CHECK (interpreted_stance IN (
        'favorable', 'desfavorable', 'neutral', 'desconoce'
    )),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(agent_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_exposure_agent ON agent_event_exposure(agent_id);
CREATE INDEX IF NOT EXISTS idx_exposure_event ON agent_event_exposure(event_id);

-- ============================================================================
-- TABLA: surveys
-- ============================================================================

CREATE TABLE IF NOT EXISTS surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    survey_type VARCHAR(50) CHECK (survey_type IN (
        'coyuntura', 'aprobacion', 'evaluacion_pais', 
        'economia', 'evento_especifico', 'test_cuestionario'
    )),
    
    benchmark_source VARCHAR(100),
    field_date DATE,
    version VARCHAR(20) DEFAULT '1.0',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_surveys_type ON surveys(survey_type);
CREATE INDEX IF NOT EXISTS idx_surveys_active ON surveys(is_active);

-- ============================================================================
-- TABLA: survey_questions
-- ============================================================================

CREATE TABLE IF NOT EXISTS survey_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    
    question_code VARCHAR(100) NOT NULL,
    question_text TEXT NOT NULL,
    
    answer_type VARCHAR(50) CHECK (answer_type IN (
        'yes_no', 'scale_1_7', 'scale_1_5', 'scale_1_10',
        'multiple_choice', 'ranking', 'open_short'
    )),
    
    options_json JSONB,
    order_index INTEGER NOT NULL,
    benchmark_question_code VARCHAR(100),
    
    UNIQUE(survey_id, question_code)
);

CREATE INDEX IF NOT EXISTS idx_questions_survey ON survey_questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_questions_code ON survey_questions(question_code);

-- ============================================================================
-- TABLA: benchmarks (DEBE IR ANTES DE survey_runs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS benchmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    source_name VARCHAR(100) NOT NULL,
    source_wave VARCHAR(50),
    field_date DATE,
    
    methodology_json JSONB,
    results_json JSONB NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    imported_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_benchmarks_source ON benchmarks(source_name);
CREATE INDEX IF NOT EXISTS idx_benchmarks_date ON benchmarks(field_date);

-- ============================================================================
-- TABLA: survey_runs
-- ============================================================================

CREATE TABLE IF NOT EXISTS survey_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    
    run_type VARCHAR(50) CHECK (run_type IN (
        'completa', 'muestra', 'segmento', 'calibracion'
    )),
    
    sample_size INTEGER NOT NULL,
    benchmark_id UUID REFERENCES benchmarks(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 'running', 'completed', 'error', 'cancelled'
    )),
    completed_at TIMESTAMPTZ,
    model_parameters JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_runs_survey ON survey_runs(survey_id);
CREATE INDEX IF NOT EXISTS idx_runs_status ON survey_runs(status);
CREATE INDEX IF NOT EXISTS idx_runs_created ON survey_runs(created_at);

-- ============================================================================
-- TABLA: survey_responses
-- ============================================================================

CREATE TABLE IF NOT EXISTS survey_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL REFERENCES survey_runs(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    
    question_code VARCHAR(100) NOT NULL,
    answer_raw TEXT,
    answer_structured_json JSONB,
    confidence DECIMAL(5, 4),
    response_time_ms INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_responses_run ON survey_responses(run_id);
CREATE INDEX IF NOT EXISTS idx_responses_agent ON survey_responses(agent_id);
CREATE INDEX IF NOT EXISTS idx_responses_question ON survey_responses(question_code);
CREATE INDEX IF NOT EXISTS idx_responses_run_question ON survey_responses(run_id, question_code);

-- ============================================================================
-- TABLA: calibration_runs
-- ============================================================================

CREATE TABLE IF NOT EXISTS calibration_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    benchmark_id UUID REFERENCES benchmarks(id),
    model_version VARCHAR(50) NOT NULL,
    
    metrics_json JSONB NOT NULL,
    parameter_snapshot JSONB NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    is_current BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_calibration_benchmark ON calibration_runs(benchmark_id);
CREATE INDEX IF NOT EXISTS idx_calibration_current ON calibration_runs(is_current);

-- ============================================================================
-- VISTAS
-- ============================================================================

CREATE OR REPLACE VIEW v_agent_demographics AS
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

CREATE OR REPLACE VIEW v_survey_results AS
SELECT 
    sr.run_id,
    s.name AS survey_name,
    sr.question_code,
    sq.question_text,
    COUNT(*) AS response_count,
    AVG(COALESCE((sr.answer_structured_json->>'score')::DECIMAL, 0)) AS avg_score,
    AVG(sr.confidence) AS avg_confidence
FROM survey_responses sr
JOIN survey_runs sru ON sr.run_id = sru.id
JOIN surveys s ON sru.survey_id = s.id
JOIN survey_questions sq ON sru.survey_id = sq.survey_id AND sr.question_code = sq.question_code
GROUP BY sr.run_id, s.name, sr.question_code, sq.question_text;

-- ============================================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================================

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
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (sin dependencia de auth.jwt para selfhost)
CREATE POLICY "Public read access to agents" ON agents FOR SELECT USING (TRUE);
CREATE POLICY "Public read access to agent_traits" ON agent_traits FOR SELECT USING (TRUE);
CREATE POLICY "Public read access to agent_memory" ON agent_memory FOR SELECT USING (TRUE);
CREATE POLICY "Public read access to agent_state" ON agent_state FOR SELECT USING (TRUE);
CREATE POLICY "Public read access to validated events" ON events FOR SELECT USING (validated = TRUE);
CREATE POLICY "Public read access to survey_responses" ON survey_responses FOR SELECT USING (TRUE);

-- Políticas de escritura (abiertas para desarrollo - restringir en producción)
CREATE POLICY "Enable insert for authenticated users only" ON agents FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for authenticated users only" ON agents FOR UPDATE USING (TRUE);
CREATE POLICY "Enable delete for authenticated users only" ON agents FOR DELETE USING (TRUE);

CREATE POLICY "Enable insert for all users" ON agent_traits FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for all users" ON agent_traits FOR UPDATE USING (TRUE);

CREATE POLICY "Enable insert for all users" ON agent_memory FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for all users" ON agent_memory FOR UPDATE USING (TRUE);

CREATE POLICY "Enable insert for all users" ON agent_state FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for all users" ON agent_state FOR UPDATE USING (TRUE);

CREATE POLICY "Enable insert for all users" ON events FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for all users" ON events FOR UPDATE USING (TRUE);

CREATE POLICY "Enable insert for all users" ON survey_responses FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for all users" ON survey_responses FOR UPDATE USING (TRUE);

-- ============================================================================
-- SEMILLA INICIAL
-- ============================================================================

INSERT INTO agents (region, comuna, urban_rural, sex, age, education, income_decile) VALUES 
    ('Metropolitana', 'Santiago', 'urbano', 'femenino', 35, 'universitaria_completa', 7),
    ('Metropolitana', 'Puente Alto', 'urbano', 'masculino', 45, 'media_completa', 5),
    ('Valparaíso', 'Viña del Mar', 'urbano', 'femenino', 28, 'tecnica_completa', 6),
    ('Biobío', 'Concepción', 'urbano', 'masculino', 52, 'universitaria_completa', 8),
    ('Araucanía', 'Temuco', 'rural', 'femenino', 38, 'media_completa', 4)
ON CONFLICT DO NOTHING;