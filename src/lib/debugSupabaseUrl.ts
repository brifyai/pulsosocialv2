/**
 * Debug utility para identificar qué está causando requests a /supabase-proxy
 * 
 * Uso: Importar este módulo en main.tsx (antes que cualquier otro código)
 * 
 * import './lib/debugSupabaseUrl';
 */

if (typeof window !== 'undefined') {
  const SUPABASE_PROXY_PATH = '/supabase-proxy';
  
  // 1. Log de window.__ENV__ al cargar
  console.log('[DebugSupabaseUrl] window.__ENV__:', (window as any).__ENV__);
  
  // 2. Interceptar fetch para detectar requests a /supabase-proxy
  const originalFetch = window.fetch.bind(window);
  
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' 
      ? input 
      : input instanceof URL 
        ? input.toString() 
        : input.url || '';
    
    if (url.includes(SUPABASE_PROXY_PATH)) {
      console.error(
        '[DebugSupabaseUrl] ⚠️ FETCH DETECTADO A /supabase-proxy:',
        '\n  URL:', url,
        '\n  Input:', input,
        '\n  Init:', init
      );
      
      // Stack trace para identificar el origen
      console.trace('[DebugSupabaseUrl] Stack trace del fetch:');
    }
    
    return originalFetch(input, init);
  };
  
  console.log('[DebugSupabaseUrl] Debug enabled - interceptando fetches a /supabase-proxy');
}

export {};