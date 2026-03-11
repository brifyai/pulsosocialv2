/**
 * SurveyDashboard - Panel de Control de Encuestas
 * 
 * Componente principal para visualizar y ejecutar encuestas sintéticas
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useAction } from 'convex/react';
import { api } from '../../_generated/api';

// ============================================================================
// TIPOS
// ============================================================================

interface SurveyStats {
  questionCode: string;
  avgScore: number;
  avgConfidence: number;
  responseCount: number;
}

interface SurveyResult {
  stats: SurveyStats[];
  raw: any[];
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function SurveyDashboard() {
  const [selectedSurvey, setSelectedSurvey] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunId, setLastRunId] = useState<string | null>(null);

  // Obtener preguntas de calibración
  const calibrationQuestions = useQuery(api.surveyEngine.getCademCalibrationQuestions);
  
  // Obtener resultados si hay un run seleccionado
  const results = useQuery(
    api.surveyEngine.getSurveyResults, 
    lastRunId ? { runId: lastRunId } : 'skip'
  );

  // Acción para ejecutar encuesta
  const executeSurvey = useAction(api.surveyEngine.executeSurveyRun);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleRunCalibration = async () => {
    if (!calibrationQuestions) return;
    
    setIsRunning(true);
    
    try {
      // Generar IDs de agentes de ejemplo (en producción, esto vendría de Supabase)
      const agentIds = Array.from({ length: 100 }, (_, i) => `agent-${i}`);
      
      const result = await executeSurvey({
        runId: `cadem-${Date.now()}`,
        surveyId: 'cadem-calibration',
        agentIds,
        questions: calibrationQuestions.map(q => ({
          code: q.code,
          type: q.type,
          topic: q.topic,
        })),
      });
      
      console.log('Encuesta completada:', result);
      setLastRunId(`cadem-${Date.now()}`);
    } catch (error) {
      console.error('Error al ejecutar encuesta:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Panel Sintético Chile</h1>
          <p className="text-gray-400">
            Sistema de encuestas con población sintética
          </p>
        </header>

        {/* Sección de Ejecución */}
        <section className="mb-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Ejecutar Encuesta de Calibración</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Preguntas Cadem</h3>
              {calibrationQuestions ? (
                <ul className="space-y-2">
                  {calibrationQuestions.map((q, idx) => (
                    <li key={q.code} className="bg-gray-700 rounded p-3">
                      <span className="text-blue-400 font-mono text-sm">{q.code}</span>
                      <p className="mt-1">{q.text}</p>
                      <span className="text-xs text-gray-500">
                        Tipo: {q.type} | Tópico: {q.topic}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Cargando preguntas...</p>
              )}
            </div>

            <button
              onClick={handleRunCalibration}
              disabled={isRunning || !calibrationQuestions}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 
                         text-white font-semibold py-3 px-6 rounded-lg 
                         transition-colors duration-200"
            >
              {isRunning ? 'Ejecutando...' : 'Ejecutar Encuesta (100 agentes)'}
            </button>
          </div>
        </section>

        {/* Sección de Resultados */}
        {results && (
          <section className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Resultados</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.stats.map((stat) => (
                <ResultCard key={stat.questionCode} stat={stat} />
              ))}
            </div>
          </section>
        )}

        {/* Información de Estado */}
        <section className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Estado del Sistema</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatusCard 
              label="Agentes en BD" 
              value="1,500" 
              icon="👥"
            />
            <StatusCard 
              label="Encuestas Ejecutadas" 
              value={lastRunId ? '1' : '0'} 
              icon="📊"
            />
            <StatusCard 
              label="Estado" 
              value={isRunning ? 'Ejecutando' : 'Disponible'} 
              icon={isRunning ? '⏳' : '✅'}
            />
            <StatusCard 
              label="Regiones" 
              value="16" 
              icon="🗺️"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTES SECUNDARIOS
// ============================================================================

function ResultCard({ stat }: { stat: SurveyStats }) {
  const percentage = Math.round(stat.avgScore * 100);
  const color = getScoreColor(stat.avgScore);
  
  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-mono text-blue-400 mb-2">{stat.questionCode}</h3>
      
      {/* Barra de progreso */}
      <div className="relative h-4 bg-gray-600 rounded-full overflow-hidden mb-2">
        <div 
          className={`absolute left-0 top-0 h-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Estadísticas */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Score promedio</span>
        <span className="font-semibold">{stat.avgScore.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-sm mt-1">
        <span className="text-gray-400">Confianza</span>
        <span className="font-semibold">{(stat.avgConfidence * 100).toFixed(0)}%</span>
      </div>
      <div className="flex justify-between text-sm mt-1">
        <span className="text-gray-400">Respuestas</span>
        <span className="font-semibold">{stat.responseCount}</span>
      </div>
    </div>
  );
}

function StatusCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="bg-gray-700 rounded-lg p-4 text-center">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}

// ============================================================================
// UTILS
// ============================================================================

function getScoreColor(score: number): string {
  if (score >= 0.7) return 'bg-green-500';
  if (score >= 0.5) return 'bg-yellow-500';
  if (score >= 0.3) return 'bg-orange-500';
  return 'bg-red-500';
}