import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    // Activar sourcemaps para debug en producción
    sourcemap: true,
    // Asegurar que el build sea estático
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    allowedHosts: ['ai-town-your-app-name.fly.dev', 'localhost', '127.0.0.1', '*.easypanel.host'],
    // Proxy para desarrollo local (evita CORS)
    proxy: {
      '/rest': {
        target: 'https://pulsosocialv2-pulsosocialbdv3.dsb9vm.easypanel.host',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/rest/, '/rest'),
      },
    },
  },
  preview: {
    port: 80,
    host: true,
  },
});
