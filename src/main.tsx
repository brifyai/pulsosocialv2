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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConvexClientProvider>
      <Home />
    </ConvexClientProvider>
  </React.StrictMode>,
);
