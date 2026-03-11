# Configuración de CORS para Supabase

## Problema

El frontend está alojado en:
```
https://pulsosocialv2-pulsosocialv2.dsb9vm.easypanel.host
```

Pero Supabase está en:
```
https://pulsosocialv2-pulsosocialbdv3.dsb9vm.easypanel.host
```

Esto causa errores de CORS porque los dominios son diferentes.

## Solución

### Opción 1: Configurar CORS en Supabase (Recomendado)

1. **Conéctate a tu base de datos Supabase** usando psql o pgAdmin

2. **Ejecuta el siguiente SQL** para configurar CORS:

```sql
-- Habilitar la extensión pg_cors si no está habilitada
-- (Solo disponible en Supabase Cloud o instalaciones con privilegios de superusuario)

-- Alternativa: Configurar headers CORS en la API REST
-- Ve a la dashboard de Supabase -> Project Settings -> API
-- Agrega el dominio del frontend a "Allowed Origins (CORS)"
```

3. **En la Dashboard de Supabase:**
   - Ve a **Project Settings** (engranaje en la barra lateral)
   - Selecciona **API**
   - En **Allowed Origins (CORS)**, agrega:
     ```
     https://pulsosocialv2-pulsosocialv2.dsb9vm.easypanel.host
     ```
   - Si quieres permitir todos los orígenes (no recomendado para producción):
     ```
     *
     ```
   - Haz clic en **Save**

### Opción 2: Usar un Proxy

Si no puedes modificar la configuración de Supabase, puedes usar un proxy:

```typescript
// src/lib/supabase.ts
export const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseAnonKey(),
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    // Usar proxy para evitar CORS
    headers: {
      'X-Proxy-Url': '/api/supabase-proxy',
    },
  }
);
```

### Opción 3: Mismo Dominio

La solución más limpia es tener el frontend y Supabase en el mismo dominio:

```
Frontend: https://app.tudominio.com
Supabase: https://db.tudominio.com
```

O usar un subdominio único:

```
Frontend: https://tudominio.com
Supabase: https://api.tudominio.com
```

## Verificación

Después de configurar CORS, verifica que funcione:

1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Network**
3. Recarga la página
4. Busca una petición `OPTIONS` a Supabase
5. Verifica que la respuesta incluya:
   ```
   Access-Control-Allow-Origin: https://pulsosocialv2-pulsosocialv2.dsb9vm.easypanel.host
   ```

## Notas Importantes

- ⚠️ **Nunca** uses `*` para Allowed Origins en producción con datos sensibles
- ✅ Usa siempre el dominio específico de tu frontend
- 🔒 La `anon key` de Supabase es segura para exponer en el frontend
- 🔄 Los cambios en CORS pueden tardar unos minutos en propagarse

## Enlaces Útiles

- [Supabase CORS Documentation](https://supabase.com/docs/guides/api#cors)
- [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)