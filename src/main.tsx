import React from 'react';
import ReactDOM from 'react-dom/client';
import Home from './App.tsx';
import './index.css';
import 'uplot/dist/uPlot.min.css';
import 'react-toastify/dist/ReactToastify.css';
import ConvexClientProvider from './components/ConvexClientProvider.tsx';
import { enableSupabaseProxy } from './lib/supabaseProxy';

// Habilitar proxy de Supabase para evitar CORS en producción
if (import.meta.env.PROD) {
  enableSupabaseProxy();
  console.log('[main.tsx] Supabase proxy enabled');
}

// Fix: Deshabilitar StrictMode en producción para evitar errores con pixi-viewport
// StrictMode monta/desmonta componentes dos veces en desarrollo, lo que causa
// problemas con librerías que manejan estado externo como pixi-viewport
const enableStrictMode = import.meta.env.DEV;

ReactDOM.createRoot(document.getElementById('root')!).render(
  enableStrictMode ? (
    <React.StrictMode>
      <ConvexClientProvider>
        <Home />
      </ConvexClientProvider>
    </React.StrictMode>
  ) : (
    <ConvexClientProvider>
      <Home />
    </ConvexClientProvider>
  ),
);
