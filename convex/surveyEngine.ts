/**
 * Survey Engine - Motor de Encuestas Sintéticas
 * 
 * Este módulo implementa el flujo de respuesta de encuestas:
 * 1. Cargar perfil del agente desde Supabase
 * 2. Cargar rasgos de personalidad
 * 3. Cargar memoria resumida
 * 4. Cargar eventos expuestos
 * 5. Calcular probabilidad estructurada
 * 6. Convertir a categoría de respuesta
 * 7. (Opcional) LLM genera texto natural
 * 8. Guardar respuesta con trazabilidad en Supabase
 */

import { v } from 'convex/values';
import { query, mutation, action } from './_generated/server';
import { internal } from './_generated/api';
import { httpAction } from './_generated/server';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURACION DEL MOTOR
// ============================================================================

interface EngineConfig {
  ideology_weight: number;
  trust_modifier: number;
  economic_sensitivity: number;
  news_exposure_curve: number;
  social_desirability_bias: number;
}

const DEFAULT_CONFIG: EngineConfig = {
  ideology_weight: 0.7,
  trust_modifier: 0.3,
  economic_sensitivity: 0.5,
  news_exposure_curve: 0.4,
  social_desirability_bias: 0.2,
};

// ============================================================================
// TIPOS INTERNOS
// ============================================================================

interface AgentContext {
  id: string;
  demographics: {
    region: string;
    age: number;
    education: string;
    income_decile: number;
  };
  traits: {
    ideology_score: number;
    institutional_trust: number;
    risk_aversion: number;
    civic_interest: number;
    social_desirability: number;
    economic_stress: number;
  };
  memory: {
    previous_positions: Record<string, string>;
    salient_topics: string[];
  };
  exposedEvents: Array<{
    topic: string;
    stance: 'favorable' | 'desfavorable' | 'neutral' | 'desconoce';
    exposure_level: number;
  }>;
}

interface QuestionContext {
  code: string;
  type: 'yes_no' | 'scale_1_7' | 'scale_1_5' | 'multiple_choice' | 'open_short';
  topic: string;
  options?: string[];
}

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Calcula la respuesta de un agente a una pregunta
 * 
 * Flujo:
 * 1. Determinar topicos relevantes
 * 2. Calcular influencia de ideología
 * 3. Calcular influencia de confianza institucional
 * 4. Calcular influencia de eventos expuestos
 * 5. Aplicar sesgo de deseabilidad social
 * 6. Generar score final
 */
export const calculateResponse = query({
  args: {
    agentId: v.string(),
    questionCode: v.string(),
    questionType: v.string(),
    questionTopic: v.string(),
    runId: v.string(),
  },
  handler: async (ctx, args) => {
    const config = DEFAULT_CONFIG;
    
    // 1. Cargar datos del agente desde Supabase (vía HTTP)
    // Nota: En producción, esto llamaría a Supabase directamente
    // Por ahora, usamos datos simulados basados en el ID
    
    // 2. Cargar eventos expuestos
    // 3. Calcular respuesta estructurada
    const response = computeStructuredResponse({
      agentContext: {
        id: args.agentId,
        demographics: {
          region: 'Metropolitana',
          age: 35,
          education: 'universitaria_completa',
          income_decile: 7,
        },
        traits: {
          ideology_score: 0.4,
          institutional_trust: 0.3,
          risk_aversion: 0.6,
          civic_interest: 0.5,
          social_desirability: 0.4,
          economic_stress: 0.7,
        },
        memory: {
          previous_positions: {},
          salient_topics: ['economia', 'gobierno'],
        },
        exposedEvents: [],
      },
      questionContext: {
        code: args.questionCode,
        type: args.questionType as any,
        topic: args.questionTopic,
      },
      config,
    });
    
    return response;
  },
});

/**
 * Ejecuta una encuesta completa a múltiples agentes
 */
export const executeSurveyRun = action({
  args: {
    runId: v.string(),
    surveyId: v.string(),
    agentIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const results: Array<{
      agentId: string;
      questionCode: string;
      response: any;
    }> = [];
    
    // Procesar cada agente
    for (const agentId of args.agentIds) {
      // Obtener preguntas de la encuesta
      // Para cada pregunta, calcular respuesta
      // Guardar respuestas
    }
    
    return { completed: true, totalResponses: results.length };
  },
});

// ============================================================================
// MOTOR DE CALCULO DE RESPUESTAS
// ============================================================================

/**
 * Computa una respuesta estructurada basada en el perfil del agente
 */
function computeStructuredResponse(input: {
  agentContext: AgentContext;
  questionContext: QuestionContext;
  config: EngineConfig;
}): {
  score: number;
  selected_option: string;
  confidence: number;
  reason: string;
} {
  const { agentContext, questionContext, config } = input;
  
  // 1. Calcular score base según tópico
  let baseScore = calculateBaseScore(agentContext, questionContext);
  
  // 2. Aplicar modificadores por rasgos
  baseScore = applyTraitModifiers(baseScore, agentContext, config);
  
  // 3. Aplicar influencia de eventos
  baseScore = applyEventInfluence(baseScore, agentContext, config);
  
  // 4. Aplicar sesgo de deseabilidad social
  baseScore = applySocialDesirability(baseScore, agentContext, config);
  
  // 5. Calcular confianza basada en consistencia
  const confidence = calculateConfidence(baseScore, agentContext);
  
  // 6. Convertir a opción según tipo de pregunta
  const selectedOption = convertToOption(baseScore, questionContext);
  
  // 7. Generar razón breve
  const reason = generateReason(baseScore, agentContext, questionContext);
  
  return {
    score: Math.max(0, Math.min(1, baseScore)),
    selected_option: selectedOption,
    confidence,
    reason,
  };
}

/**
 * Calcula score base según tópico y perfil demográfico
 */
function calculateBaseScore(agent: AgentContext, question: QuestionContext): number {
  // Score por defecto: 0.5 (neutral)
  let score = 0.5;
  
  // Ajustar según ideología para preguntas políticas
  if (['aprobacion', 'gobierno', 'politica'].includes(question.topic)) {
    // Ideología: 0 = izquierda, 1 = derecha
    // Para aprobación de gobierno de izquierda: correlación negativa
    score = 1 - agent.traits.ideology_score;
  }
  
  // Ajustar según educación para preguntas económicas
  if (['economia', 'empleo', 'inflacion'].includes(question.topic)) {
    // Mayor educación → más crítico
    const educationFactor = getEducationFactor(agent.demographics.education);
    score = score * (1 - 0.2 * educationFactor);
  }
  
  // Ajustar según estrés económico
  if (['economia', 'gobierno', 'pais'].includes(question.topic)) {
    score = score * (1 - 0.3 * agent.traits.economic_stress);
  }
  
  return score;
}

/**
 * Aplica modificadores basados en rasgos de personalidad
 */
function applyTraitModifiers(
  score: number,
  agent: AgentContext,
  config: EngineConfig
): number {
  // Modificador por confianza institucional
  const trustMod = (agent.traits.institutional_trust - 0.5) * config.trust_modifier;
  score += trustMod;
  
  // Modificador por aversión al riesgo (más conservador)
  if (agent.traits.risk_aversion > 0.7) {
    score = score * 0.9; // Tiende hacia posiciones más conservadoras
  }
  
  // Modificador por interés cívico (más informado)
  if (agent.traits.civic_interest > 0.7) {
    // Mayor variabilidad (más opinión formada)
    score = 0.5 + (score - 0.5) * 1.2;
  }
  
  return score;
}

/**
 * Aplica influencia de eventos noticiosos expuestos
 */
function applyEventInfluence(
  score: number,
  agent: AgentContext,
  config: EngineConfig
): number {
  const relevantEvents = agent.exposedEvents.filter(
    e => e.exposure_level > 0.5
  );
  
  for (const event of relevantEvents) {
    const influence = event.exposure_level * config.news_exposure_curve;
    
    if (event.stance === 'favorable') {
      score += influence * 0.1;
    } else if (event.stance === 'desfavorable') {
      score -= influence * 0.1;
    }
  }
  
  return score;
}

/**
 * Aplica sesgo de deseabilidad social
 */
function applySocialDesirability(
  score: number,
  agent: AgentContext,
  config: EngineConfig
): number {
  const bias = agent.traits.social_desirability * config.social_desirability_bias;
  
  // Las respuestas socialmente deseables tienden al centro
  score = score * (1 - bias) + 0.5 * bias;
  
  return score;
}

/**
 * Calcula confianza en la respuesta
 */
function calculateConfidence(score: number, agent: AgentContext): number {
  // Confianza base
  let confidence = 0.7;
  
  // Mayor interés cívico → más confianza
  confidence += agent.traits.civic_interest * 0.2;
  
  // Score extremo → más confianza
  const extremity = Math.abs(score - 0.5) * 2;
  confidence += extremity * 0.1;
  
  return Math.min(1, confidence);
}

/**
 * Convierte score numérico a opción según tipo de pregunta
 */
function convertToOption(score: number, question: QuestionContext): string {
  if (question.type === 'yes_no') {
    return score >= 0.5 ? 'Sí' : 'No';
  }
  
  if (question.type === 'scale_1_7') {
    const scaled = Math.round(score * 6) + 1;
    return scaled.toString();
  }
  
  if (question.type === 'scale_1_5') {
    const scaled = Math.round(score * 4) + 1;
    return scaled.toString();
  }
  
  if (question.type === 'multiple_choice' && question.options) {
    const index = Math.floor(score * question.options.length);
    return question.options[Math.min(index, question.options.length - 1)];
  }
  
  return 'Ns/Nc';
}

/**
 * Genera razón breve para la respuesta
 */
function generateReason(
  score: number,
  agent: AgentContext,
  question: QuestionContext
): string {
  const reasons: string[] = [];
  
  // Razón por ideología
  if (question.topic === 'aprobacion') {
    if (agent.traits.ideology_score < 0.33) {
      reasons.push('perspectiva de izquierda');
    } else if (agent.traits.ideology_score > 0.66) {
      reasons.push('perspectiva de derecha');
    }
  }
  
  // Razón por situación económica
  if (agent.traits.economic_stress > 0.7) {
    reasons.push('preocupación económica');
  }
  
  // Razón por confianza
  if (agent.traits.institutional_trust < 0.3) {
    reasons.push('baja confianza institucional');
  }
  
  if (reasons.length === 0) {
    reasons.push('opinión basada en perfil demográfico');
  }
  
  return reasons.join(', ');
}

// ============================================================================
// HELPERS
// ============================================================================

function getEducationFactor(education: string): number {
  const factors: Record<string, number> = {
    'sin_estudios': 0,
    'basica_completa': 0.2,
    'media_incompleta': 0.4,
    'media_completa': 0.5,
    'tecnica_completa': 0.7,
    'universitaria_completa': 1.0,
  };
  return factors[education] || 0.5;
}

// ============================================================================
// CLIENTE SUPABASE
// ============================================================================

function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL y SUPABASE_ANON_KEY deben estar configuradas');
  }
  
  // Nota: Usamos createClient de @supabase/supabase-js
  // Esto requiere instalar el paquete en Convex
  const { createClient } = require('@supabase/supabase-js');
  return createClient(supabaseUrl, supabaseKey);
}

// ============================================================================
// FUNCIONES DE UTILIDAD PARA ENCUESTAS
// ============================================================================

/**
 * Obtiene preguntas de calibración Cadem
 */
export const getCademCalibrationQuestions = query({
  args: {},
  handler: async (ctx) => {
    return [
      {
        code: 'aprueba_boric',
        text: '¿Aprueba o desaprueba la gestión del presidente Boric?',
        type: 'scale_1_7' as const,
        topic: 'aprobacion',
      },
      {
        code: 'aprueba_gobierno',
        text: '¿Aprueba o desaprueba la gestión del gobierno?',
        type: 'scale_1_7' as const,
        topic: 'aprobacion',
      },
      {
        code: 'evaluacion_pais',
        text: '¿Cómo cree que va el país?',
        type: 'scale_1_7' as const,
        topic: 'pais',
      },
      {
        code: 'situacion_economica',
        text: '¿Cómo calificaría su situación económica personal?',
        type: 'scale_1_7' as const,
        topic: 'economia',
      },
    ];
  },
});

/**
 * Obtiene datos completos de un agente desde Supabase
 */
export const getAgentData = action({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    const supabase = createSupabaseClient();
    
    // 1. Obtener datos demográficos
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', args.agentId)
      .single();
    
    if (agentError || !agent) {
      throw new Error(`Agente no encontrado: ${args.agentId}`);
    }
    
    // 2. Obtener rasgos
    const { data: traits } = await supabase
      .from('agent_traits')
      .select('*')
      .eq('agent_id', args.agentId)
      .single();
    
    // 3. Obtener memoria
    const { data: memory } = await supabase
      .from('agent_memory')
      .select('*')
      .eq('agent_id', args.agentId)
      .single();
    
    // 4. Obtener estado
    const { data: state } = await supabase
      .from('agent_state')
      .select('*')
      .eq('agent_id', args.agentId)
      .single();
    
    return {
      agent,
      traits: traits || {},
      memory: memory || {},
      state: state || {},
    };
  },
});

/**
 * Registra respuesta de encuesta en Supabase
 */
export const registerResponse = action({
  args: {
    runId: v.string(),
    agentId: v.string(),
    questionCode: v.string(),
    answerRaw: v.string(),
    answerStructured: v.any(),
    confidence: v.number(),
    responseTimeMs: v.number(),
  },
  handler: async (ctx, args) => {
    const supabase = createSupabaseClient();
    
    const { error } = await supabase
      .from('survey_responses')
      .insert({
        run_id: args.runId,
        agent_id: args.agentId,
        question_code: args.questionCode,
        answer_raw: args.answerRaw,
        answer_structured_json: args.answerStructured,
        confidence: args.confidence,
        response_time_ms: args.responseTimeMs,
      });
    
    if (error) {
      throw new Error(`Error al registrar respuesta: ${error.message}`);
    }
    
    return { success: true };
  },
});

/**
 * Ejecuta encuesta completa a un agente
 */
export const executeAgentSurvey = action({
  args: {
    runId: v.string(),
    agentId: v.string(),
    questions: v.array(v.object({
      code: v.string(),
      type: v.string(),
      topic: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const results = [];
    
    // 1. Obtener datos del agente
    const agentData = await ctx.runAction(internal.surveyEngine.getAgentData, {
      agentId: args.agentId,
    });
    
    const agentContext: AgentContext = {
      id: agentData.agent.id,
      demographics: {
        region: agentData.agent.region,
        age: agentData.agent.age,
        education: agentData.agent.education,
        income_decile: agentData.agent.income_decile,
      },
      traits: {
        ideology_score: agentData.traits.ideology_score || 0.5,
        institutional_trust: agentData.traits.institutional_trust || 0.5,
        risk_aversion: agentData.traits.risk_aversion || 0.5,
        civic_interest: agentData.traits.civic_interest || 0.5,
        social_desirability: agentData.traits.social_desirability || 0.5,
        economic_stress: agentData.state.economic_stress || 0.5,
      },
      memory: {
        previous_positions: agentData.memory.previous_positions || {},
        salient_topics: agentData.memory.salient_topics || [],
      },
      exposedEvents: [],
    };
    
    // 2. Procesar cada pregunta
    for (const question of args.questions) {
      const response = computeStructuredResponse({
        agentContext,
        questionContext: {
          code: question.code,
          type: question.type as any,
          topic: question.topic,
        },
        config: DEFAULT_CONFIG,
      });
      
      // 3. Registrar respuesta
      await ctx.runAction(internal.surveyEngine.registerResponse, {
        runId: args.runId,
        agentId: args.agentId,
        questionCode: question.code,
        answerRaw: response.selected_option,
        answerStructured: response,
        confidence: response.confidence,
        responseTimeMs: Math.floor(Math.random() * 5000) + 1000,
      });
      
      results.push({
        questionCode: question.code,
        response,
      });
    }
    
    return results;
  },
});

/**
 * Ejecuta encuesta completa a múltiples agentes
 */
export const executeSurveyRun = action({
  args: {
    runId: v.string(),
    surveyId: v.string(),
    agentIds: v.array(v.string()),
    questions: v.array(v.object({
      code: v.string(),
      type: v.string(),
      topic: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const allResults = [];
    
    for (const agentId of args.agentIds) {
      try {
        const results = await ctx.runAction(internal.surveyEngine.executeAgentSurvey, {
          runId: args.runId,
          agentId,
          questions: args.questions,
        });
        allResults.push({ agentId, results });
      } catch (error) {
        console.error(`Error procesando agente ${agentId}:`, error);
      }
    }
    
    return {
      completed: true,
      totalAgents: args.agentIds.length,
      successfulAgents: allResults.length,
    };
  },
});

/**
 * Obtiene resultados agregados de una encuesta
 */
export const getSurveyResults = query({
  args: { runId: v.string() },
  handler: async (ctx, args) => {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('survey_responses')
      .select(`
        question_code,
        answer_structured_json,
        confidence,
        agents!inner(region, age, sex, education, income_decile)
      `)
      .eq('run_id', args.runId);
    
    if (error) {
      throw new Error(`Error al obtener resultados: ${error.message}`);
    }
    
    // Agrupar por pregunta
    const byQuestion: Record<string, any[]> = {};
    for (const response of data || []) {
      if (!byQuestion[response.question_code]) {
        byQuestion[response.question_code] = [];
      }
      byQuestion[response.question_code].push(response);
    }
    
    // Calcular estadísticas
    const stats = Object.entries(byQuestion).map(([code, responses]) => {
      const scores = responses
        .map(r => r.answer_structured_json?.score)
        .filter(s => typeof s === 'number');
      
      const avgScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;
      
      const avgConfidence = responses
        .map(r => r.confidence)
        .reduce((a, b) => a + b, 0) / responses.length;
      
      return {
        questionCode: code,
        avgScore,
        avgConfidence,
        responseCount: responses.length,
      };
    });
    
    return { stats, raw: data };
  },
});
