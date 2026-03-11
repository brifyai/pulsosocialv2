import { createClient } from '@supabase/supabase-js';

// Obtener variables de entorno de Vite (build-time) o del objeto window (runtime)
// Esto permite inyección de variables en runtime via Docker
declare global {
  interface Window {
    __ENV__?: {
      VITE_SUPABASE_URL?: string;
      VITE_SUPABASE_ANON_KEY?: string;
      VITE_CONVEX_URL?: string;
    };
  }
}

const getSupabaseAnonKey = (): string => {
  // 1. Intentar con variables de Vite (build-time)
  const viteKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (viteKey) return viteKey;
  
  // 2. Intentar con REACT_APP_ (compatibilidad)
  const reactAppKey = import.meta.env.REACT_APP_SUPABASE_ANON_KEY;
  if (reactAppKey) return reactAppKey;
  
  // 3. Intentar con window.__ENV__ (runtime injection via Docker)
  const runtimeKey = window.__ENV__?.VITE_SUPABASE_ANON_KEY;
  if (runtimeKey) return runtimeKey;
  
  throw new Error(
    'VITE_SUPABASE_ANON_KEY no está configurada. ' +
    'Verifica las variables de entorno en Docker/Easypanel.'
  );
};

// Usar proxy local para evitar CORS
// nginx.conf tiene location /rest/ que proxy a Supabase con headers CORS
const getSupabaseProxyUrl = (): string => {
  // Usar ruta relativa - el proxy nginx maneja CORS
  return '/rest';
};

// Conectar a Supabase a través del proxy nginx para evitar CORS
export const supabase = createClient(
  getSupabaseProxyUrl(),  // '/rest' - proxy nginx
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

// Función helper para obtener URL de Supabase
export const getSupabaseEndpoint = (): string => {
  return getSupabaseProxyUrl();
};