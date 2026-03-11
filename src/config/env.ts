/**
 * Configuración de entornos para PulsoSocial
 * 
 * Usa variables de entorno de Vite (import.meta.env)
 * Las variables deben empezar con VITE_ para ser expuestas al frontend
 */

export interface EnvConfig {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_CONVEX_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

/**
 * Obtiene el hostname actual del navegador
 */
function getHostname(): string {
  if (typeof window === 'undefined') {
    return 'localhost';
  }
  return window.location.hostname.toLowerCase();
}

/**
 * Verifica si estamos en localhost
 */
function isLocalhost(): boolean {
  const hostname = getHostname();
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

/**
 * Obtiene la configuración del entorno desde variables de Vite
 * 
 * Las variables deben estar definidas en .env o en el servidor:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 * - VITE_CONVEX_URL
 */
export function getEnvConfig(): EnvConfig {
  // En Vite, las variables de entorno se acceden via import.meta.env
  const config: EnvConfig = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    VITE_CONVEX_URL: import.meta.env.VITE_CONVEX_URL || '',
    NODE_ENV: (import.meta.env.MODE as 'development' | 'production' | 'test') || 'development',
  };

  // Debug en consola (solo en desarrollo)
  if (isLocalhost() && typeof console !== 'undefined') {
    console.log('[EnvConfig] Entorno:', config.NODE_ENV);
    console.log('[EnvConfig] Configuración:', { 
      ...config, 
      VITE_SUPABASE_ANON_KEY: config.VITE_SUPABASE_ANON_KEY ? '***' : 'NO CONFIGURADA' 
    });
  }

  return config;
}

/**
 * Obtiene la URL de Supabase según el entorno
 * 
 * En producción (no localhost), usa el proxy /rest para evitar CORS
 * En desarrollo (localhost), usa la URL directa desde variables de entorno
 */
export function getSupabaseUrl(): string {
  const config = getEnvConfig();
  
  // En producción, usar proxy /rest para evitar CORS
  if (!isLocalhost()) {
    console.log('[getSupabaseUrl] ✅ Usando proxy /rest');
    return '/rest';
  }
  
  // En desarrollo, usar URL directa desde .env
  console.log('[getSupabaseUrl] ⚠️ Usando URL directa:', config.VITE_SUPABASE_URL);
  return config.VITE_SUPABASE_URL;
}

/**
 * Obtiene la clave ANON de Supabase
 */
export function getSupabaseAnonKey(): string {
  const config = getEnvConfig();
  return config.VITE_SUPABASE_ANON_KEY;
}

/**
 * Obtiene la URL de Convex
 */
export function getConvexUrl(): string {
  const config = getEnvConfig();
  return config.VITE_CONVEX_URL;
}

/**
 * Verifica si las variables requeridas están configuradas
 */
export function validateEnvConfig(): void {
  const config = getEnvConfig();
  
  const errors: string[] = [];
  
  if (!config.VITE_SUPABASE_URL) {
    errors.push('VITE_SUPABASE_URL no está configurada');
  }
  
  if (!config.VITE_SUPABASE_ANON_KEY) {
    errors.push('VITE_SUPABASE_ANON_KEY no está configurada');
  }
  
  if (!config.VITE_CONVEX_URL) {
    errors.push('VITE_CONVEX_URL no está configurada');
  }
  
  if (errors.length > 0) {
    console.error('[EnvConfig] ❌ Errores de configuración:');
    errors.forEach(err => console.error(`  - ${err}`));
    console.error('[EnvConfig] Asegúrate de tener un archivo .env con las variables VITE_* configuradas');
  }
}

/**
 * Obtiene el entorno actual (para debug)
 */
export function getCurrentEnv(): string {
  return import.meta.env.MODE || 'development';
}

// Exportar funciones para debug en ventana global
if (typeof window !== 'undefined') {
  (window as any).getEnvConfig = getEnvConfig;
  (window as any).getSupabaseUrl = getSupabaseUrl;
  (window as any).getSupabaseAnonKey = getSupabaseAnonKey;
  (window as any).getConvexUrl = getConvexUrl;
  (window as any).getCurrentEnv = getCurrentEnv;
}
