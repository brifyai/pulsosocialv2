/**
 * Tipos TypeScript para la Plataforma de Encuestas Sintéticas
 * 
 * Estos tipos definen el modelo de datos para agentes, encuestas,
 * eventos y validación.
 */

// ============================================================================
// AGENTES
// ============================================================================

export type UrbanRural = 'urbano' | 'rural';
export type Sex = 'femenino' | 'masculino' | 'otro';

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

export interface Agent {
  id: string;
  region: string;
  comuna: string;
  urban_rural: UrbanRural;
  sex: Sex;
  age: number;
  education: EducationLevel;
  income_decile: number; // 1-10
  occupation?: string;
  household_type: HouseholdType;
  connectivity_type: ConnectivityType;
  weight: number;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface AgentTraits {
  agent_id: string;
  institutional_trust: number; // 0-1
  risk_aversion: number; // 0-1
  digital_literacy: number; // 0-1
  patience: number; // 0-1
  civic_interest: number; // 0-1
  social_desirability: number; // 0-1
  openness_to_change: number; // 0-1
  ideology_score: number; // 0 (izquierda) - 1 (derecha)
  nationalism_score: number; // 0 (cosmopolita) - 1 (nacionalista)
  created_at: string;
  updated_at: string;
}

export interface AgentMemory {
  agent_id: string;
  summary: string;
  salient_topics: string[];
  previous_positions: Record<string, string>; // { tema: posicion }
  contradiction_score: number; // 0-1
  updated_at: string;
  memory_version: number;
}

export interface AgentState {
  agent_id: string;
  fatigue: number; // 0 (fresco) - 1 (agotado)
  economic_stress: number; // 0-1
  mood: number; // 0 (negativo) - 1 (positivo)
  survey_saturation: number;
  last_activation_at: string | null;
  updated_at: string;
}

export interface AgentFull {
  profile: Agent;
  traits: AgentTraits;
  memory: AgentMemory;
  state: AgentState;
}

// ============================================================================
// ENCUESTAS
// ============================================================================

export type SurveyType =
  | 'coyuntura'
  | 'aprobacion'
  | 'evaluacion_pais'
  | 'economia'
  | 'evento_especifico'
  | 'test_cuestionario';

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
  created_by?: string;
  is_active: boolean;
}

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

export type SurveyRunStatus = 'pending' | 'running' | 'completed' | 'error' | 'cancelled';
export type SurveyRunType = 'completa' | 'muestra' | 'segmento' | 'calibracion';

export interface SurveyRun {
  id: string;
  survey_id: string;
  run_type: SurveyRunType;
  sample_size: number;
  benchmark_id?: string;
  created_at: string;
  created_by?: string;
  status: SurveyRunStatus;
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
  confidence: number; // 0-1
  response_time_ms: number;
  created_at: string;
}

// ============================================================================
// EVENTOS
// ============================================================================

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
  confidence_score: number; // 0-1
  event_date: string;
  summary: string;
  metadata_json: Record<string, unknown>;
  created_at: string;
  validated: boolean;
  validated_by?: string;
}

export interface AgentEventExposure {
  id: string;
  agent_id: string;
  event_id: string;
  exposure_probability: number; // 0-1
  exposure_level: number; // 0-1
  interpreted_stance: 'favorable' | 'desfavorable' | 'neutral' | 'desconoce';
  created_at: string;
}

// ============================================================================
// BENCHMARKS Y CALIBRACION
// ============================================================================

export interface Benchmark {
  id: string;
  source_name: string; // ej: "Cadem", "CEP"
  source_wave?: string; // ej: "Enero 2025"
  field_date?: string;
  methodology_json: Record<string, unknown>;
  results_json: Record<string, unknown>; // { question_code: { option: percentage } }
  created_at: string;
  imported_by?: string;
}

export interface CalibrationRun {
  id: string;
  benchmark_id?: string;
  model_version: string;
  metrics_json: Record<string, unknown>; // { mae, rmse, max_error, ... }
  parameter_snapshot: Record<string, unknown>; // { ideology_weight, trust_modifier, ... }
  created_at: string;
  created_by?: string;
  is_current: boolean;
}

// ============================================================================
// SURVEY ENGINE
// ============================================================================

/**
 * Respuesta estructurada del motor de encuestas
 */
export interface StructuredSurveyResponse {
  question_code: string;
  selected_option: string;
  score: number; // 0-1
  confidence: number; // 0-1
  reason: string;
  agent_id: string;
  run_id: string;
  response_time_ms: number;
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

/**
 * Configuración del motor de respuesta
 */
export interface ResponseEngineConfig {
  useLLM: boolean;
  temperature: number;
  maxTokens: number;
  includeReason: boolean;
}

// ============================================================================
// VALIDACION
// ============================================================================

export interface ValidationMetrics {
  mae: number; // Mean Absolute Error
  rmse: number; // Root Mean Square Error
  max_error: number;
  directionality: number; // 0-1
  by_question: Record<string, number>;
  by_segment: Record<string, number>;
}

export interface ValidationResult {
  benchmark_id: string;
  synthetic_run_id: string;
  metrics: ValidationMetrics;
  passes_threshold: boolean;
  generated_at: string;
}

export interface ValidationAlert {
  type: 'high_error' | 'drift_detected' | 'calibration_needed';
  message: string;
  severity: 'warning' | 'error';
  created_at: string;
}

// ============================================================================
// DASHBOARD
// ============================================================================

export interface SurveyResultsSummary {
  run_id: string;
  survey_name: string;
  total_responses: number;
  completed_at: string;
  questions: {
    question_code: string;
    question_text: string;
    response_count: number;
    avg_score?: number;
    distribution: Record<string, number>;
  }[];
}

export interface AgentDemographicsSummary {
  region: string;
  sex: string;
  age_group: string;
  education: string;
  income_decile: number;
  count: number;
  weighted_count: number;
}

// ============================================================================
// UTILS
// ============================================================================

/**
 * Helper para convertir answer_type a opciones válidas
 */
export function getDefaultOptionsForAnswerType(type: AnswerType): Record<string, unknown> {
  switch (type) {
    case 'yes_no':
      return { options: ['Sí', 'No'] };
    case 'scale_1_7':
      return { min: 1, max: 7, min_label: 'Muy bajo', max_label: 'Muy alto' };
    case 'scale_1_5':
      return { min: 1, max: 5, min_label: 'Muy bajo', max_label: 'Muy alto' };
    case 'scale_1_10':
      return { min: 1, max: 10, min_label: 'Muy bajo', max_label: 'Muy alto' };
    case 'multiple_choice':
      return { options: [] };
    case 'ranking':
      return { options: [], max_selections: 3 };
    case 'open_short':
      return { max_length: 200 };
    default:
      return {};
  }
}

/**
 * Helper para validar score de rasgo (0-1)
 */
export function clampTraitScore(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Helper para convertir score numérico a categoría
 */
export function scoreToCategory(
  score: number,
  type: 'ideology' | 'trust' | 'approval'
): string {
  if (type === 'ideology') {
    if (score < 0.33) return 'izquierda';
    if (score < 0.66) return 'centro';
    return 'derecha';
  }
  if (type === 'trust' || type === 'approval') {
    if (score < 0.33) return 'bajo';
    if (score < 0.66) return 'medio';
    return 'alto';
  }
  return 'desconocido';
}