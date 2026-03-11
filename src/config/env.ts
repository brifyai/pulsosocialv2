/**
 * Configuración de entornos para PulsoSocial
 * 
 * Permite usar diferentes URLs según el entorno:
 * - development: localhost
 * - production: EasyPanel
 * - staging: (opcional)
 * 
 * Las variables se pueden definir en:
 * 1. .env.local (desarrollo, no se commitea)
 * 2. .env (valores por defecto)
 * 3. window.__ENV__ (inyección en runtime via Docker)
 */

export interface EnvConfig {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_CONVEX_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

// Valores por defecto
const defaultConfig: EnvConfig = {
  VITE_SUPABASE_URL: 'http://localhost:8000',
  VITE_SUPABASE_ANON_KEY: '',
  VITE_CONVEX_URL: 'http://localhost:3000',
  NODE_ENV: 'development',
};

// Configurations predefinidas por entorno
const envPresets: Record<string, Partial<EnvConfig>> = {
  // Desarrollo local
  development: {
    VITE_SUPABASE_URL: 'http://localhost:8000',
    VITE_CONVEX_URL: 'http://localhost:3000',
  },
  
  // Producción en EasyPanel
  production: {
    VITE_SUPABASE_URL: 'https://pulsosocialv2-pulsosocialbdv3.dsb9vm.easypanel.host',
    VITE_CONVEX_URL: 'https://blessed-anaconda-376.convex.cloud',
  },
  
  // Staging (opcional)
  staging: {
    VITE_SUPABASE_URL: 'https://staging-supabase.tudominio.com',
    VITE_CONVEX_URL: 'https://staging-convex.tudominio.com',
  },
};

/**
 * Obtiene la configuración del entorno actual
 * 
 * Prioridad:
 * 1. Variables de Vite (import.meta.env)
 * 2. Variables de React (import.meta.env.REACT_APP_*)
 * 3. window.__ENV__ (runtime injection)
 * 4. Valores por defecto
 */
export function getEnvConfig(): EnvConfig {
  // Intentar obtener de Vite primero
  const viteSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const viteSupabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const viteConvexUrl = import.meta.env.VITE_CONVEX_URL;
  
  // Fallback a REACT_APP_*
  const reactSupabaseUrl = import.meta.env.REACT_APP_SUPABASE_URL;
  const reactSupabaseKey = import.meta.env.REACT_APP_SUPABASE_ANON_KEY;
  
  // Fallback a window.__ENV__ (runtime)
  const runtimeEnv = (window as any).__ENV__ as Partial<EnvConfig> | undefined;
  
  const config: EnvConfig = {
    VITE_SUPABASE_URL: viteSupabaseUrl || reactSupabaseUrl || runtimeEnv?.VITE_SUPABASE_URL || defaultConfig.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: viteSupabaseKey || reactSupabaseKey || runtimeEnv?.VITE_SUPABASE_ANON_KEY || defaultConfig.VITE_SUPABASE_ANON_KEY,
    VITE_CONVEX_URL: viteConvexUrl || runtimeEnv?.VITE_CONVEX_URL || defaultConfig.VITE_CONVEX_URL,
    NODE_ENV: (import.meta.env.MODE as EnvConfig['NODE_ENV']) || 'development',
  };
  
  return config;
}

/**
 * Obtiene la URL de Supabase según el entorno
 * 
 * En producción, usa el proxy nginx (/rest) para evitar CORS
 * En desarrollo, usa la URL directa
 */
export function getSupabaseUrl(): string {
  const config = getEnvConfig();
  const isProd = import.meta.env.PROD;
  
  if (isProd) {
    // En producción usar proxy nginx para evitar CORS
    return '/rest';
  }
  
  // En desarrollo, usar URL directa
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
  
  if (!config.VITE_SUPABASE_ANON_KEY) {
    errors.push('VITE_SUPABASE_ANON_KEY no está configurada');
  }
  
  if (!config.VITE_CONVEX_URL) {
    errors.push('VITE_CONVEX_URL no está configurada');
  }
  
  if (errors.length > 0) {
    console.error('[EnvConfig] Errores de configuración:');
    errors.forEach(err => console.error(`  - ${err}`));
    console.warn('[EnvConfig] Usando valores por defecto. Verifica tu .env o window.__ENV__');
  }
}

// Exportar configuración actual para debug
if (typeof window !== 'undefined') {
  (window as any).getEnvConfig = getEnvConfig;
  console.log('[EnvConfig] Configuración cargada:', getEnvConfig());
}