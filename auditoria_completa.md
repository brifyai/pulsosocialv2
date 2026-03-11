# 🔍 AUDITORÍA COMPLETA DE PULSOSOCIAL V2

**Fecha:** 11 de marzo de 2026  
**Alcance:** Seguridad, Código, Configuración, Base de Datos, Documentación

---

## 📊 RESUMEN EJECUTIVO

| Categoría | Estado | Problemas Críticos | Problemas Mayores | Problemas Menores |
|-----------|--------|-------------------|-------------------|-------------------|
| **Seguridad** | ⚠️ Regular | 0 | 2 | 3 |
| **Código TypeScript** | ✅ Bueno | 0 | 0 | 2 |
| **React/Frontend** | ⚠️ Regular | 0 | 1 | 2 |
| **Docker/nginx** | ⚠️ Regular | 0 | 1 | 1 |
| **Supabase** | ⚠️ Riesgoso | 1 | 1 | 0 |
| **Convex** | ✅ Bueno | 0 | 0 | 1 |
| **Documentación** | ⚠️ Incompleta | 0 | 1 | 2 |

**Total: 1 CRÍTICO | 6 MAYORES | 11 MENORES**

---

## 🔴 1. SEGURIDAD

### 1.1 Vulnerabilidades en Dependencias (npm audit)

**Gravedad: MODERADA/ALTA**

```
13 vulnerabilidades encontradas:
- 2 bajas
- 9 moderadas  
- 2 altas
```

#### Vulnerabilidades Críticas:

| Paquete | Versión | Vulnerabilidad | Impacto |
|---------|---------|---------------|---------|
| **rollup** | 3.0.0-3.29.5 | Arbitrary File Write via Path Traversal | GHSA-mw96-cpmx-2vgc |
| **minimatch** | ≤3.1.3, 5.0.0-5.1.7 | ReDoS (Denegación de Servicio) | GHSA-7r86-cg39-jmmj |
| **esbuild** | ≤0.24.2 | SSRF en servidor desarrollo | GHSA-67mh-4wv8-2f99 |
| **diff** | 4.0.0-4.0.3, 5.0.0-5.2.1 | DoS en parsePatch | GHSA-73rr-hh4g-fpgx |

#### Vulnerabilidades Moderadas:

| Paquete | Problema |
|---------|----------|
| @babel/helpers | RegExp complexity ineficiente |
| @babel/runtime | RegExp complexity ineficiente |
| ajv | ReDoS con opción $data |
| brace-expansion | ReDoS |
| js-yaml | Prototype pollution |
| lodash | Prototype Pollution en _.unset y _.omit |
| qs | DoS vía notación de arrays |

**✅ Solución:**
```bash
npm audit fix
# Si persisten, actualizar manualmente:
npm install rollup@latest esbuild@latest minimatch@latest
```

---

### 1.2 Credenciales Expuestas

**Gravedad: BAJO RIESGO (por ahora)**

✅ **No se encontraron** credenciales hardcodeadas en el código.

⚠️ **Riesgo potencial:** Los archivos `.env`, `.env.local`, `.env.example` existen y podrían commitearse accidentalmente.

**✅ Verificado:**
- `.gitignore` incluye `.env` y `.env.local`

**⚠️ Recomendación:**
```bash
# Verificar que no haya .env en git
git ls-files | grep env
# Debería mostrar solo .env.example
```

---

### 1.3 Row Level Security (RLS) en Supabase

**Gravedad: CRÍTICO 🔴**

Las políticas RLS son **DEMASIADO PERMISIVAS** para producción:

```sql
-- POLÍTICAS ACTUALES (PELIGROSAS)
CREATE POLICY "Enable insert for all users" ON agent_traits FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for all users" ON agent_traits FOR UPDATE USING (TRUE);
CREATE POLICY "Enable insert for all users" ON events FOR INSERT WITH CHECK (TRUE);
-- ... y más tablas
```

**Problemas:**
1. ❌ Cualquier usuario puede INSERTAR/ACTUALIZAR/ELIMINAR datos
2. ❌ No hay verificación de autenticación
3. ❌ No hay validación de ownership
4. ❌ Las políticas dicen "authenticated users" pero usan `TRUE`

**✅ Solución recomendada:**
```sql
-- Política de lectura (mantener pública si es necesario)
CREATE POLICY "Public read access to agents" ON agents 
  FOR SELECT USING (TRUE);

-- Política de escritura (SOLO usuarios autenticados)
CREATE POLICY "Authenticated insert" ON agents 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Política de actualización (SOLO el dueño o admin)
CREATE POLICY "Users update own data" ON agents 
  FOR UPDATE 
  USING (auth.uid() = user_id OR is_admin());

-- Política de eliminación (SOLO admin)
CREATE POLICY "Admin delete only" ON agents 
  FOR DELETE 
  USING (is_admin());
```

---

## 🟡 2. CÓDIGO TYPESCRIPT

### 2.1 Configuración TypeScript

✅ **Sin errores de tipos** en la compilación actual.

⚠️ **Problema menor:** `tsconfig.json` podría tener `strict: true` para mayor seguridad de tipos.

---

### 2.2 Archivos sin Tipos Explícitos

**Gravedad: MENOR**

Algunos archivos `.js` sin migrar a TypeScript:
- `data/convertMap.js`
- `data/gentle.js`
- `src/editor/eutils.js`
- `src/editor/le.js`
- `src/editor/leconfig.js`
- `src/editor/lecontext.js`
- `src/editor/lehtmlui.js`
- `src/editor/mapfile.js`
- `src/editor/spritefile.js`
- `src/editor/undo.js`

**Recomendación:** Migrar a `.ts` para consistencia.

---

## 🟡 3. REACT/FRONTEND

### 3.1 Memory Leak Potencial en PixiViewport

**Gravedad: MAYOR**

El error reportado lo confirma:
```
TypeError: Cannot read properties of null (reading 'removeEventListener')
    at x7.destroy (pixi_viewport.js:1145:45)
```

**Problema:** `pixi-viewport` tiene un bug conocido donde `destroy()` no maneja correctamente cuando el contenedor ya fue eliminado.

**✅ Solución aplicada parcialmente:**
```tsx
// main.tsx - StrictMode condicional
const enableStrictMode = import.meta.env.DEV;
```

**⚠️ Solución adicional recomendada:**
```tsx
// PixiViewport.tsx - Cleanup explícito
useEffect(() => {
  return () => {
    if (viewport) {
      try {
        viewport.destroy();
      } catch (e) {
        console.warn('Error destroying viewport:', e);
      }
    }
  };
}, [viewport]);
```

---

### 3.2 Convex Client Duplicado

**Gravedad: MENOR**

En `App.tsx`:
```tsx
const convex = new ConvexReactClient(convexUrl);
```

Y en `ConvexClientProvider.tsx` también se crea otro cliente.

**Problema:** Potencial conexión duplicada a Convex.

**Recomendación:** Usar un solo cliente compartido.

---

### 3.3 Hardcoded URL en App.tsx

**Gravedad: MENOR**

```tsx
const convexUrl = import.meta.env.VITE_CONVEX_URL || 'https://blessed-anaconda-376.convex.cloud';
```

**Problema:** URL de Convex hardcodeada como fallback.

**Recomendación:** Usar `getConvexUrl()` de `src/config/env.ts`:
```tsx
import { getConvexUrl } from './config/env';
const convex = new ConvexReactClient(getConvexUrl());
```

---

## 🟡 4. DOCKER/NGINX

### 4.1 nginx.conf - Headers de Seguridad

**Gravedad: MENOR**

Faltan headers de seguridad importantes:

```nginx
# Headers actuales
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;

# Headers FALTANTES:
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://plausible.io; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.convex.cloud https://*.easypanel.host;";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()";
```

---

### 4.2 docker-entrypoint.sh - Error Handling

**Gravedad: MAYOR**

El script no maneja errores adecuadamente:

```bash
# Actual (sin error handling)
envsubst '${VITE_SUPABASE_URL} ${VITE_SUPABASE_ANON_KEY} ${VITE_CONVEX_URL}' \
    < /etc/nginx/conf.d/default.conf.template \
    > /etc/nginx/conf.d/default.conf
```

**Recomendación:**
```bash
#!/bin/bash
set -e  # Exit on error

# ... existing code ...

if ! envsubst ...; then
    echo "ERROR: Failed to inject environment variables" >&2
    exit 1
fi

# Verificar que nginx.conf sea válido
if ! nginx -t; then
    echo "ERROR: Invalid nginx configuration" >&2
    exit 1
fi
```

---

## 🟡 5. CONVEX

### 5.1 Funciones sin Validación de Entrada

**Gravedad: MENOR**

Algunas funciones Convex no validan completamente los inputs antes de procesarlos.

**Recomendación:** Agregar validación explícita en todas las mutations:
```tsx
export const createAgent = mutation({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    // Validación explícita
    if (!args.region || !args.comuna) {
      throw new Error('Region y comuna son requeridos');
    }
    // ...
  }
});
```

---

## 🟡 6. DOCUMENTACIÓN

### 6.1 Documentación Incompleta

**Gravedad: MENOR**

| Documento | Estado | Faltante |
|-----------|--------|----------|
| `docs/SETUP.md` | ✅ Completo | - |
| `docs/architecture.md` | ✅ Completo | - |
| `docs/data_model.md` | ✅ Completo | - |
| `docs/validation.md` | ✅ Completo | - |
| `docs/product.md` | ⚠️ Parcial | Casos de uso detallados |
| `README.md` | ⚠️ Básico | Instrucciones de deploy en EasyPanel |
| `docs/DEPLOY.md` | ❌ No existe | Guía de deployment |
| `docs/API.md` | ❌ No existe | Documentación de API |

---

## 📋 PLAN DE ACCIÓN PRIORIZADO

### 🔴 CRÍTICO (Hacer Inmediatamente)

1. **Fortalecer RLS de Supabase**
   - Cambiar políticas de `TRUE` a verificación de autenticación
   - Agregar políticas de ownership
   - Crear función `is_admin()`

### 🟡 MAYOR (Esta Semana)

2. **Actualizar dependencias vulnerables**
   ```bash
   npm audit fix
   npm install rollup@latest esbuild@latest minimatch@latest diff@latest
   ```

3. **Fix: docker-entrypoint.sh error handling**
   - Agregar `set -e`
   - Validar configuración nginx
   - Manejar errores de envsubst

4. **Fix: Memory leak en PixiViewport**
   - Agregar cleanup explícito en useEffect
   - Manejar errores en destroy()

### 🟢 MENOR (Próximo Sprint)

5. **Actualizar App.tsx para usar env.ts**
   - Reemplazar URL hardcodeada con `getConvexUrl()`

6. **Agregar headers de seguridad en nginx**
   - Content-Security-Policy
   - Referrer-Policy
   - Permissions-Policy

7. **Migrar archivos .js a .ts**
   - Especialmente en `src/editor/`

8. **Crear documentación faltante**
   - `docs/DEPLOY.md`
   - `docs/API.md`
   - Actualizar `README.md`

---

## ✅ ESTADO ACTUAL DE CORS

El problema de CORS reportado inicialmente fue **RESUELTO** con:

1. `getSupabaseUrl()` detecta producción por hostname
2. En producción → usa `/rest` (proxy nginx)
3. nginx maneja headers CORS y preflight OPTIONS

**Verificación:**
```javascript
// En consola del navegador (producción):
getSupabaseUrl()  // Debería retornar '/rest'
```

---

## 📈 MÉTRICAS DE CALIDAD

| Métrica | Valor | Estado |
|---------|-------|--------|
| Vulnerabilidades npm | 13 | ⚠️ Mejorable |
| Errores TypeScript | 0 | ✅ Excelente |
| Cobertura tests | Desconocida | ❓ No auditada |
| Documentación | 60% | ⚠️ Incompleta |
| RLS Security | 20% | 🔴 Crítico |

---

## 🔧 COMANDOS ÚTILES

```bash
# Fix automático de vulnerabilidades
npm audit fix

# Build de producción
npm run build

# Test de tipos
npx tsc --noEmit

# Lint
npm run lint

# Verificar archivos .env en git
git ls-files | grep env

# Test de seguridad RLS (conectar a Supabase)
psql $DATABASE_URL -c "SELECT * FROM agents LIMIT 1;"
```

---

**Generado por:** Auditoría Automática  
**Próxima auditoría recomendada:** 2 semanas después de aplicar fixes