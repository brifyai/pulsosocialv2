/**
 * EventViewer - Visor de Eventos y Noticias
 * 
 * Permite ver y filtrar eventos noticiosos que afectan a los agentes,
 * así como crear nuevos eventos para simular impactos en la población.
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

interface Event {
  id: string;
  title: string;
  topic: string;
  territory: string | null;
  source: string;
  source_type: string;
  confidence_score: number;
  event_date: string;
  summary: string;
  metadata_json: Record<string, any>;
  validated: boolean;
  validated_by: string | null;
  created_at: string;
}

interface FilterState {
  topic: string;
  sourceType: string;
  territory: string;
  validated: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function EventViewer() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    topic: '',
    sourceType: '',
    territory: '',
    validated: '',
  });

  useEffect(() => {
    loadEvents();
  }, [filters]);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false })
        .limit(100);

      if (filters.topic) {
        query = query.eq('topic', filters.topic);
      }
      if (filters.sourceType) {
        query = query.eq('source_type', filters.sourceType);
      }
      if (filters.territory) {
        query = query.eq('territory', filters.territory);
      }
      if (filters.validated === 'true') {
        query = query.eq('validated', true);
      } else if (filters.validated === 'false') {
        query = query.eq('validated', false);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setEvents(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Eventos y Noticias</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {showCreateForm ? 'Cancelar' : '+ Nuevo Evento'}
        </button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <FilterSelect
          label="Tópico"
          value={filters.topic}
          onChange={(v) => handleFilterChange('topic', v)}
          options={TOPIC_OPTIONS}
        />
        <FilterSelect
          label="Tipo de Fuente"
          value={filters.sourceType}
          onChange={(v) => handleFilterChange('sourceType', v)}
          options={SOURCE_TYPE_OPTIONS}
        />
        <FilterSelect
          label="Territorio"
          value={filters.territory}
          onChange={(v) => handleFilterChange('territory', v)}
          options={TERRITORY_OPTIONS}
        />
        <FilterSelect
          label="Validación"
          value={filters.validated}
          onChange={(v) => handleFilterChange('validated', v)}
          options={VALIDATED_OPTIONS}
        />
      </div>

      {/* Formulario de creación */}
      {showCreateForm && <CreateEventForm onClose={() => setShowCreateForm(false)} />}

      {/* Estado */}
      {loading && <div className="text-center py-8">Cargando...</div>}
      {error && <div className="text-red-400 py-8">Error: {error}</div>}

      {/* Lista de eventos */}
      {!loading && !error && events.length > 0 && (
        <div className="space-y-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No se encontraron eventos
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENTES SECUNDARIOS
// ============================================================================

function EventCard({ event }: { event: Event }) {
  const confidenceColor =
    event.confidence_score >= 0.8
      ? 'text-green-400'
      : event.confidence_score >= 0.5
      ? 'text-yellow-400'
      : 'text-red-400';

  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-semibold">{event.title}</h3>
          <p className="text-sm text-gray-400">
            {event.topic} • {event.source} • {new Date(event.event_date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <span className={`text-sm font-mono ${confidenceColor}`}>
            {(event.confidence_score * 100).toFixed(0)}% confianza
          </span>
          {event.validated && (
            <span className="text-xs bg-green-600 px-2 py-1 rounded">Validado</span>
          )}
        </div>
      </div>
      <p className="text-gray-300 text-sm mb-2">{event.summary}</p>
      <div className="flex gap-2 text-xs text-gray-500">
        <span className="bg-gray-600 px-2 py-1 rounded">{event.source_type}</span>
        {event.territory && (
          <span className="bg-gray-600 px-2 py-1 rounded">{event.territory}</span>
        )}
      </div>
    </div>
  );
}

function CreateEventForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    territory: '',
    source: '',
    source_type: 'prensa_nacional',
    confidence_score: 0.8,
    event_date: new Date().toISOString().split('T')[0],
    summary: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from('events').insert({
        ...formData,
        event_date: new Date(formData.event_date).toISOString(),
        metadata_json: {},
        validated: false,
      });

      if (error) throw error;
      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (err: any) {
      alert('Error al crear evento: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-700 rounded-lg p-4 mb-6 space-y-4">
      <h3 className="text-lg font-semibold">Crear Nuevo Evento</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Título</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-gray-600 rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Tópico</label>
          <select
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            className="w-full bg-gray-600 rounded px-3 py-2"
            required
          >
            <option value="">Seleccionar...</option>
            {TOPIC_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Territorio</label>
          <select
            value={formData.territory}
            onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
            className="w-full bg-gray-600 rounded px-3 py-2"
          >
            <option value="">Nacional</option>
            {TERRITORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Fuente</label>
          <input
            type="text"
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            className="w-full bg-gray-600 rounded px-3 py-2"
            placeholder="Ej: La Tercera"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Tipo de Fuente</label>
          <select
            value={formData.source_type}
            onChange={(e) => setFormData({ ...formData, source_type: e.target.value })}
            className="w-full bg-gray-600 rounded px-3 py-2"
          >
            {SOURCE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Confianza</label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={formData.confidence_score}
            onChange={(e) => setFormData({ ...formData, confidence_score: parseFloat(e.target.value) })}
            className="w-full bg-gray-600 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Fecha</label>
          <input
            type="date"
            value={formData.event_date}
            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
            className="w-full bg-gray-600 rounded px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Resumen</label>
        <textarea
          value={formData.summary}
          onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
          className="w-full bg-gray-600 rounded px-3 py-2"
          rows={3}
          required
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white px-4 py-2 rounded"
        >
          {submitting ? 'Guardando...' : 'Guardar Evento'}
        </button>
        {success && <span className="text-green-400">¡Evento creado!</span>}
      </div>
    </form>
  );
}

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
      <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
      >
        <option value="">Todos</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// ============================================================================
// OPCIONES
// ============================================================================

const TOPIC_OPTIONS = [
  { label: 'Economía', value: 'economia' },
  { label: 'Gobierno', value: 'gobierno' },
  { label: 'Salud', value: 'salud' },
  { label: 'Educación', value: 'educacion' },
  { label: 'Seguridad', value: 'seguridad' },
  { label: 'Vivienda', value: 'vivienda' },
  { label: 'Pensiones', value: 'pensiones' },
  { label: 'Medio Ambiente', value: 'medio_ambiente' },
  { label: 'Transporte', value: 'transporte' },
  { label: 'Derechos Humanos', value: 'ddhh' },
];

const SOURCE_TYPE_OPTIONS = [
  { label: 'Oficial', value: 'oficial' },
  { label: 'Prensa Nacional', value: 'prensa_nacional' },
  { label: 'Prensa Regional', value: 'prensa_regional' },
  { label: 'Think Tank', value: 'think_tank' },
  { label: 'Internacional', value: 'internacional' },
  { label: 'Redes Sociales', value: 'redes_sociales' },
];

const TERRITORY_OPTIONS = [
  { label: 'Metropolitana', value: 'Metropolitana' },
  { label: 'Valparaíso', value: 'Valparaíso' },
  { label: 'Biobío', value: 'Biobío' },
  { label: 'Araucanía', value: 'Araucanía' },
  { label: 'Nacional', value: 'nacional' },
];

const VALIDATED_OPTIONS = [
  { label: 'Validados', value: 'true' },
  { label: 'No validados', value: 'false' },
];