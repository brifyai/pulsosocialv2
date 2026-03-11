# Deploy en EasyPanel - Sin Docker

Este proyecto ahora usa **React puro con Vite** para el build estático, sin necesidad de Docker.

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

### 4. Variables de Entorno (Opcional)

No son necesarias porque la configuración está hardcodeada en `src/config/env.ts`, pero puedes agregarlas si quieres:

```
NODE_ENV=production
```

### 5. Configurar Proxy para Supabase (Importante)

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
| `easypanel.json` | Configuración de EasyPanel (build, routes, proxy) |
| `vite.config.ts` | Configuración de Vite con proxy para desarrollo |
| `src/config/env.ts` | Configuración de URLs por entorno (localhost/producción) |
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

## 🐛 Debug

Si hay problemas, verifica en la consola del navegador:

```javascript
// Debería mostrar la URL correcta según el entorno
window.getSupabaseUrl()

// En producción debería retornar: "/rest"
// En localhost debería retornar: "http://localhost:8000"
```

## 📝 Notas

- El archivo `easypanel.json` contiene la configuración completa
- No necesitas Dockerfile ni docker-compose.yml
- El build genera archivos estáticos en la carpeta `dist/`
- EasyPanel sirve directamente desde `dist/`
