# Deploy en EasyPanel - Sin Docker

Este proyecto ahora usa **React puro con Vite** para el build estático, sin necesidad de Docker.

**Dominio**: `pulsossociales.com`

## 🚀 Configuración en EasyPanel

### 1. Crear Nuevo Servicio

1. Ve a EasyPanel Dashboard
2. Clic en **"Create Service"**
3. Selecciona **"Static Site"**

### 2. Configurar Git

- **Repository**: `https://github.com/brifyai/pulsosocialv2.git`
- **Branch**: `main`

### 3. Configurar Build

- **Build Command**: `npm install && npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. Configurar Variables de Entorno (IMPORTANTE)

En la sección de **Environment Variables**, agrega:

```
VITE_SUPABASE_URL=https://pulsosocialv2-pulsosocialbdv3.dsb9vm.easypanel.host
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
VITE_CONVEX_URL=https://blessed-anaconda-376.convex.cloud
```

**Nota**: Las variables deben empezar con `VITE_` para que Vite las exponga al frontend.

### 5. Configurar Dominio Personalizado

En la sección de **Domains**:
- Agrega: `pulsossociales.com`
- Configura el DNS de tu dominio para apuntar al servidor de EasyPanel

### 6. Configurar Proxy para Supabase (Importante)

En la sección de **Routes** o **Proxy**, agrega:

```
Path: /rest/*
Target: https://pulsosocialv2-pulsosocialbdv3.dsb9vm.easypanel.host/rest/$1
Headers:
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
  Access-Control-Allow-Headers: apikey, Authorization, Content-Type, X-Client-Info
```

Esto evita el error de CORS al hacer que las peticiones a `/rest` sean proxyeadas al backend de Supabase.

## 📁 Archivos Importantes

| Archivo | Descripción |
|---------|-------------|
| `easypanel.json` | Configuración de EasyPanel (build, routes, proxy, dominio) |
| `vite.config.ts` | Configuración de Vite con proxy para desarrollo |
| `src/config/env.ts` | Configuración de URLs por entorno (localhost/pulsossociales.com) |
| `package.json` | Scripts de build: `easypanel:build` y `easypanel:start` |

## 🔧 Scripts Disponibles

```bash
# Desarrollo local
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Build específico para EasyPanel
npm run easypanel:build
```

## ✅ Ventajas de esta Configuración

1. **Sin Docker**: Build más rápido y simple
2. **Proxy integrado**: Las peticiones a `/rest` van al backend automáticamente
3. **Detección automática**: El código detecta si está en localhost o producción
4. **CORS resuelto**: El proxy maneja los headers de CORS
5. **Dominio propio**: Funciona con `pulsossociales.com`

## 🐛 Debug

Si hay problemas, verifica en la consola del navegador:

```javascript
// Debería mostrar la URL correcta según el entorno
window.getSupabaseUrl()

// En pulsossociales.com debería retornar: "/rest"
// En localhost debería retornar: "http://localhost:8000"
```

## 📝 Notas

- El archivo `easypanel.json` contiene la configuración completa incluyendo el dominio
- No necesitas Dockerfile ni docker-compose.yml
- El build genera archivos estáticos en la carpeta `dist/`
- EasyPanel sirve directamente desde `dist/`
- El dominio `pulsossociales.com` debe estar configurado en el DNS
