/**
 * AgentList - Lista de Agentes con Filtros
 * 
 * Visualiza la población sintética almacenada en Supabase
 * con capacidades de filtrado por región, edad, educación, etc.
 */

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// TIPOS
// ============================================================================

interface Agent {
  id: string;
  region: string;
  comuna: string;
  urban_rural: string;
  sex: string;
  age: number;
  education: string;
  income_decile: number;
  occupation: string;
  household_type: string;
  connectivity_type: string;
  weight: number;
}

interface AgentTraits {
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

interface FilterState {
  region: string;
  sex: string;
  ageGroup: string;
  education: string;
  incomeDecile: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function AgentList() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [traits, setTraits] = useState<Map<string, AgentTraits>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<FilterState>({
    region: '',
    sex: '',
    ageGroup: '',
    education: '',
    incomeDecile: '',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
  });

  // ============================================================================
  // EFECTOS
  // ============================================================================

  useEffect(() => {
    loadAgents();
  }, [filters, pagination.page]);

  // ============================================================================
  // FUNCIONES DE CARGA
  // ============================================================================

  const loadAgents = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('agents')
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (filters.region) {
        query = query.eq('region', filters.region);
      }
      if (filters.sex) {
        query = query.eq('sex', filters.sex);
      }
      if (filters.education) {
        query = query.eq('education', filters.education);
      }
      if (filters.incomeDecile) {
        query = query.eq('income_decile', parseInt(filters.incomeDecile));
      }
      if (filters.ageGroup) {
        const [min, max] = filters.ageGroup.split('-').map(Number);
        if (max) {
          query = query.gte('age', min).lte('age', max);
        } else {
          query = query.gte('age', min);
        }
      }

      // Paginación
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to);

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setAgents(data || []);
      setPagination(prev => ({ ...prev, total: count || 0 }));

      // Cargar rasgos para los agentes mostrados
      if (data && data.length > 0) {
        loadTraits(data.map(a => a.id));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTraits = async (agentIds: string[]) => {
    try {
      const { data } = await supabase
        .from('agent_traits')
        .select('*')
        .in('agent_id', agentIds);

      if (data) {
        const traitsMap = new Map<string, AgentTraits>();
        data.forEach(t => traitsMap.set(t.agent_id, t));
        setTraits(traitsMap);
      }
    } catch (err) {
      console.error('Error loading traits:', err);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-semibold mb-4">Población Sintética</h2>
      
      {/* Filtros */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <FilterSelect
          label="Región"
          value={filters.region}
          onChange={(v) => handleFilterChange('region', v)}
          options={REGIONS_OPTIONS}
        />
        <FilterSelect
          label="Sexo"
          value={filters.sex}
          onChange={(v) => handleFilterChange('sex', v)}
          options={SEX_OPTIONS}
        />
        <FilterSelect
          label="Edad"
          value={filters.ageGroup}
          onChange={(v) => handleFilterChange('ageGroup', v)}
          options={AGE_GROUP_OPTIONS}
        />
        <FilterSelect
          label="Educación"
          value={filters.education}
          onChange={(v) => handleFilterChange('education', v)}
          options={EDUCATION_OPTIONS}
        />
        <FilterSelect
          label="Decil Ingreso"
          value={filters.incomeDecile}
          onChange={(v) => handleFilterChange('incomeDecile', v)}
          options={INCOME_DECILE_OPTIONS}
        />
      </div>

      {/* Estado */}
      {loading && <div className="text-center py-8">Cargando...</div>}
      {error && <div className="text-red-400 py-8">Error: {error}</div>}

      {/* Tabla */}
      {!loading && !error && agents.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-700">
                <tr>
                  <th className="px-4 py-3">Región</th>
                  <th className="px-4 py-3">Edad</th>
                  <th className="px-4 py-3">Sexo</th>
                  <th className="px-4 py-3">Educación</th>
                  <th className="px-4 py-3">Decil</th>
                  <th className="px-4 py-3">Ideología</th>
                  <th className="px-4 py-3">Confianza</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => {
                  const agentTraits = traits.get(agent.id);
                  return (
                    <tr key={agent.id} className="border-b border-gray-700 hover:bg-gray-700">
                      <td className="px-4 py-3">{agent.region}</td>
                      <td className="px-4 py-3">{agent.age}</td>
                      <td className="px-4 py-3">{agent.sex}</td>
                      <td className="px-4 py-3">{agent.education}</td>
                      <td className="px-4 py-3">{agent.income_decile}</td>
                      <td className="px-4 py-3">
                        <TraitBadge value={agentTraits?.ideology_score} />
                      </td>
                      <td className="px-4 py-3">
                        <TraitBadge value={agentTraits?.institutional_trust} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-400">
              Mostrando {agents.length} de {pagination.total} agentes
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="px-4 py-2">
                Página {pagination.page} de {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= totalPages}
                className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}

      {!loading && !error && agents.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No se encontraron agentes con los filtros seleccionados
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENTES SECUNDARIOS
// ============================================================================

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
      >
        <option value="">Todos</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TraitBadge({ value }: { value?: number }) {
  if (value === undefined) return <span className="text-gray-500">-</span>;
  
  const percentage = Math.round(value * 100);
  let color = 'bg-gray-500';
  
  if (value >= 0.7) color = 'bg-green-500';
  else if (value >= 0.5) color = 'bg-yellow-500';
  else if (value >= 0.3) color = 'bg-orange-500';
  else color = 'bg-red-500';
  
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-gray-600 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
      </div>
      <span className="text-xs">{percentage}%</span>
    </div>
  );
}

// ============================================================================
// OPCIONES DE FILTROS
// ============================================================================

const REGIONS_OPTIONS = [
  { label: 'Metropolitana', value: 'Metropolitana' },
  { label: 'Valparaíso', value: 'Valparaíso' },
  { label: 'Biobío', value: 'Biobío' },
  { label: 'Araucanía', value: 'Araucanía' },
  { label: 'Los Lagos', value: 'Los Lagos' },
  { label: 'Maule', value: 'Maule' },
  { label: 'O\'Higgins', value: 'O\'Higgins' },
  { label: 'Coquimbo', value: 'Coquimbo' },
  { label: 'Antofagasta', value: 'Antofagasta' },
  { label: 'Ñuble', value: 'Ñuble' },
  { label: 'Tarapacá', value: 'Tarapacá' },
  { label: 'Los Ríos', value: 'Los Ríos' },
  { label: 'Atacama', value: 'Atacama' },
  { label: 'Arica y Parinacota', value: 'Arica y Parinacota' },
  { label: 'Magallanes', value: 'Magallanes' },
  { label: 'Aysén', value: 'Aysén' },
];

const SEX_OPTIONS = [
  { label: 'Femenino', value: 'femenino' },
  { label: 'Masculino', value: 'masculino' },
];

const AGE_GROUP_OPTIONS = [
  { label: '18-29', value: '18-29' },
  { label: '30-44', value: '30-44' },
  { label: '45-64', value: '45-64' },
  { label: '65+', value: '65-100' },
];

const EDUCATION_OPTIONS = [
  { label: 'Sin estudios', value: 'sin_estudios' },
  { label: 'Básica completa', value: 'basica_completa' },
  { label: 'Media incompleta', value: 'media_incompleta' },
  { label: 'Media completa', value: 'media_completa' },
  { label: 'Técnica completa', value: 'tecnica_completa' },
  { label: 'Universitaria completa', value: 'universitaria_completa' },
];

const INCOME_DECILE_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  label: `Decil ${i + 1}`,
  value: (i + 1).toString(),
}));