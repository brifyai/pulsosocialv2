import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from '../config/env';

/**
 * Cliente de Supabase con URLs dinámicas
 * 
 * - Desarrollo: Conecta directo a Supabase local
 * - Producción: Usa proxy nginx (/rest) para evitar CORS
 */
export const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseAnonKey(),
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

/**
 * Obtiene el endpoint de Supabase (para debug o uso externo)
 */
export const getSupabaseEndpoint = (): string => {
  return getSupabaseUrl();
};