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
  };
}

const getSupabaseUrl = (): string => {
  // 1. Intentar con variables de Vite (build-time)
  const viteUrl = import.meta.env.VITE_SUPABASE_URL;
  if (viteUrl) return viteUrl;
  
  // 2. Intentar con REACT_APP_ (compatibilidad)
  const reactAppUrl = import.meta.env.REACT_APP_SUPABASE_URL;
  if (reactAppUrl) return reactAppUrl;
  
  // 3. Intentar con window.__ENV__ (runtime injection via Docker)
  const runtimeUrl = window.__ENV__?.VITE_SUPABASE_URL;
  if (runtimeUrl) return runtimeUrl;
  
  throw new Error(
    'VITE_SUPABASE_URL no está configurada. ' +
    'Verifica las variables de entorno en Docker/Easypanel.'
  );
};

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
// El proxy reenvía las peticiones a Supabase con headers CORS correctos
const getSupabaseProxyUrl = (): string => {
  // Usar el proxy NGINX configurado en /supabase-proxy/
  // Esto evita problemas de CORS porque las peticiones van al mismo origen
  return `${window.location.origin}/supabase-proxy`;
};

// Crear cliente de Supabase usando el proxy
// Esto es necesario porque el frontend y Supabase están en dominios diferentes
export const supabase = createClient(
  getSupabaseProxyUrl(),  // Usar proxy en lugar de URL directa
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
    global: {
      headers: {
        'X-Use-Proxy': 'true',
      },
    },
  }
);

// Función helper para obtener URL de Supabase (directa o por proxy)
export const getSupabaseEndpoint = (): string => {
  return getSupabaseProxyUrl();
};