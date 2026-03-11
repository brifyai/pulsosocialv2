/**
 * Proxy para Supabase que evita CORS
 * 
 * Este módulo intercepta las peticiones fetch y las redirige
 * a través del proxy NGINX local (/supabase-proxy/) para evitar
 * los errores de CORS cuando el frontend y Supabase están en
 * dominios diferentes.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 
                     import.meta.env.REACT_APP_SUPABASE_URL ||
                     window.__ENV__?.VITE_SUPABASE_URL;

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 
                          import.meta.env.REACT_APP_SUPABASE_ANON_KEY ||
                          window.__ENV__?.VITE_SUPABASE_ANON_KEY;

// Proxy URL - mismo origen que el frontend
const PROXY_BASE = window.location.origin + '/supabase-proxy';

// Guardar el fetch original
const originalFetch = window.fetch;

/**
 * Intercepta las peticiones fetch a Supabase y las redirige al proxy
 */
export function enableSupabaseProxy(): void {
  // Override del fetch global
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    
    // Si la URL es de Supabase, usar el proxy
    if (url.startsWith(SUPABASE_URL || 'NEVER_MATCH')) {
      // Reemplazar la URL de Supabase con la del proxy
      const proxiedUrl = url.replace(SUPABASE_URL!, PROXY_BASE);
      
      console.log('[SupabaseProxy] Interceptando petición:', url, '->', proxiedUrl);
      
      // Asegurar que los headers de autorización se mantengan
      const headers = new Headers(init?.headers || {});
      headers.set('apikey', SUPABASE_ANON_KEY || '');
      headers.set('Authorization', `Bearer ${SUPABASE_ANON_KEY || ''}`);
      headers.set('Content-Type', 'application/json');
      
      return originalFetch(proxiedUrl, {
        ...init,
        headers,
        mode: 'cors',
      });
    }
    
    // Para otras peticiones, usar el fetch original
    return originalFetch.apply(this, [input, init]);
  };
}

/**
 * Deshabilita el proxy y restaura el fetch original
 */
export function disableSupabaseProxy(): void {
  window.fetch = originalFetch;
}

/**
 * Obtiene la URL de Supabase (directa o por proxy)
 */
export function getSupabaseUrl(): string {
  if (import.meta.env.PROD) {
    return PROXY_BASE;
  }
  return SUPABASE_URL || '';
}

/**
 * Obtiene la clave ANON de Supabase
 */
export function getSupabaseAnonKey(): string {
  return SUPABASE_ANON_KEY || '';
}