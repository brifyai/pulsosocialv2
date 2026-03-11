/**
 * Configuración de entornos para PulsoSocial
 * 
 * SOLUCIÓN DEFINITIVA: Detección automática por hostname
 * 
 * Esta configuración:
 * 1. Detecta automáticamente el entorno por el hostname del navegador
 * 2. Usa configuraciones predefinidas por dominio
 * 3. NO requiere variables de entorno externas
 * 4. Funciona inmediatamente después del deploy
 * 
 * Entornos soportados:
 * - localhost: Desarrollo local
 * - *.easypanel.host: Producción en EasyPanel
 * - Otros: Configuración personalizada
 */

export interface EnvConfig {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_CONVEX_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

/**
 * Configuraciones predefinidas por patrón de hostname
 */
const ENV_PRESETS: Record<string, Omit<EnvConfig, 'NODE_ENV'>> = {
  // Desarrollo local
  localhost: {
    VITE_SUPABASE_URL: 'http://localhost:8000',
    VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDE3NjkyMDAsImV4cCI6MTc5OTUzNTYwMH0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE',
    VITE_CONVEX_URL: 'http://localhost:3000',
  },
  
  // Producción en EasyPanel - Pulsosocial V2
  'easypanel.host': {
    VITE_SUPABASE_URL: 'https://pulsosocialv2-pulsosocialbdv3.dsb9vm.easypanel.host',
    VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE',
    VITE_CONVEX_URL: 'https://blessed-anaconda-376.convex.cloud',
  },
  
  // Producción en dominio personalizado
  'pulsossociales.com': {
    VITE_SUPABASE_URL: 'https://pulsosocialv2-pulsosocialbdv3.dsb9vm.easypanel.host',
    VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE',
    VITE_CONVEX_URL: 'https://blessed-anaconda-376.convex.cloud',
  },
};

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
 * Detecta el entorno actual basándose en el hostname
 * 
 * Prioridad de detección:
 * 1. Coincidencia exacta con claves de ENV_PRESETS
 * 2. Coincidencia por subdominio (terminación del hostname)
 * 3. Fallback a localhost (desarrollo)
 */
function detectEnv(): string {
  const hostname = getHostname();
  
  // Coincidencia exacta
  if (hostname in ENV_PRESETS) {
    return hostname;
  }
  
  // Coincidencia por terminación (para subdominios)
  for (const [key] of Object.entries(ENV_PRESETS)) {
    if (hostname.endsWith('.' + key) || hostname.endsWith(key)) {
      return key;
    }
  }
  
  // Fallback a localhost
  return 'localhost';
}

/**
 * Obtiene la configuración del entorno actual
 * 
 * Esta función:
 * 1. Detecta automáticamente el entorno por hostname
 * 2. Retorna la configuración predefinida para ese entorno
 * 3. NO depende de variables de entorno externas
 */
export function getEnvConfig(): EnvConfig {
  const envKey = detectEnv();
  const preset = ENV_PRESETS[envKey] || ENV_PRESETS.localhost;
  const isProduction = envKey !== 'localhost';
  
  const config: EnvConfig = {
    ...preset,
    NODE_ENV: isProduction ? 'production' : 'development',
  };
  
  // Debug en consola (solo en desarrollo)
  if (!isProduction && typeof console !== 'undefined') {
    console.log('[EnvConfig] Entorno detectado:', envKey);
    console.log('[EnvConfig] Configuración:', { ...config, VITE_SUPABASE_ANON_KEY: '***' });
  }
  
  return config;
}

/**
 * Obtiene la URL de Supabase según el entorno
 * 
 * En producción (EasyPanel), usa el proxy nginx (/rest) para evitar CORS
 * En desarrollo (localhost), usa la URL directa
 */
export function getSupabaseUrl(): string {
  const config = getEnvConfig();
  const supabaseUrl = config.VITE_SUPABASE_URL;
  
  // Verificar si estamos en producción por el hostname actual
  const hostname = getHostname();
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  // DEBUG: Siempre loguear en producción
  if (typeof console !== 'undefined') {
    console.log('[getSupabaseUrl] Hostname:', hostname);
    console.log('[getSupabaseUrl] isLocalhost:', isLocalhost);
    console.log('[getSupabaseUrl] Returning:', !isLocalhost ? '/rest' : supabaseUrl);
  }
  
  // En producción, usar proxy nginx para evitar CORS
  if (!isLocalhost) {
    console.log('[getSupabaseUrl] ✅ Using /rest proxy');
    return '/rest';
  }
  
  // En desarrollo, usar URL directa
  console.log('[getSupabaseUrl] ⚠️ Using direct URL:', supabaseUrl);
  return supabaseUrl;
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
  }
}

/**
 * Obtiene el entorno actual (para debug)
 */
export function getCurrentEnv(): string {
  return detectEnv();
}

// Exportar funciones para debug en ventana global
if (typeof window !== 'undefined') {
  (window as any).getEnvConfig = getEnvConfig;
  (window as any).getSupabaseUrl = getSupabaseUrl;
  (window as any).getSupabaseAnonKey = getSupabaseAnonKey;
  (window as any).getConvexUrl = getConvexUrl;
  (window as any).getCurrentEnv = getCurrentEnv;
}