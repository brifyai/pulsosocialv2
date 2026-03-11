import { createClient } from '@supabase/supabase-js';

// Obtener variables de entorno de Vite
// Vite reemplaza estas variables en tiempo de build
const getSupabaseUrl = (): string => {
  const url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.REACT_APP_SUPABASE_URL;
  if (!url) {
    throw new Error(
      'VITE_SUPABASE_URL o REACT_APP_SUPABASE_URL no está configurada. ' +
      'Asegúrate de pasar las variables de entorno correctamente en el build de Docker.'
    );
  }
  return url;
};

const getSupabaseAnonKey = (): string => {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.REACT_APP_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      'VITE_SUPABASE_ANON_KEY o REACT_APP_SUPABASE_ANON_KEY no está configurada. ' +
      'Asegúrate de pasar las variables de entorno correctamente en el build de Docker.'
    );
  }
  return key;
};

export const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseAnonKey()
);
