# Configuración de CORS para Supabase - Actualizado

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

## Solución para Easypanel/Supabase Self-hosted

Dado que estás usando Supabase self-hosted en Easypanel, la configuración de CORS se hace de forma diferente.

### Opción 1: Configurar Kong API Gateway (Recomendado)

Supabase usa Kong como API gateway. Debes configurar los headers CORS en Kong:

1. **En la dashboard de Easypanel**, busca tu servicio de Supabase
2. **Encuentra la configuración de Kong** (el API gateway)
3. **Agrega un plugin de CORS** o modifica la configuración existente

### Opción 2: Configurar vía Variables de Entorno en Supabase

En tu deployment de Supabase en Easypanel:

1. **Ve a tu proyecto en Easypanel**
2. **Busca las variables de entorno** del servicio de Supabase (Kong/API)
3. **Agrega o modifica** estas variables:

```bash
# Headers CORS para Kong
KONG_HTTP_HEADERS=Access-Control-Allow-Origin:https://pulsosocialv2-pulsosocialv2.dsb9vm.easypanel.host,Access-Control-Allow-Methods:GET,HEAD,POST,PUT,DELETE,OPTIONS,Access-Control-Allow-Headers:Origin,Authorization,Content-Type
```

### Opción 3: Configurar vía SQL en la base de datos

Conéctate a tu base de datos Supabase y ejecuta:

```sql
-- Configurar CORS para el API REST
-- Esto configura PostgREST para aceptar CORS

-- Primero, verifica si existe la configuración
SHOW server_config;

-- Configurar headers CORS (puede requerir reinicio del servicio)
ALTER SYSTEM SET "app.settings.cors_origins" TO 'https://pulsosocialv2-pulsosocialv2.dsb9vm.easypanel.host';
```

### Opción 4: Usar un Proxy NGINX (Solución Alternativa)

Si no puedes modificar la configuración de Supabase, puedes configurar un proxy inverso en el mismo dominio:

1. **En Easypanel**, agrega un servicio NGINX proxy
2. **Configura el proxy** para redirigir `/api/supabase/*` a Supabase
3. **Agrega headers CORS** en NGINX:

```nginx
location /api/supabase/ {
    proxy_pass https://pulsosocialv2-pulsosocialbdv3.dsb9vm.easypanel.host/;
    
    # CORS headers
    add_header Access-Control-Allow-Origin "https://pulsosocialv2-pulsosocialv2.dsb9vm.easypanel.host" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
    
    # Handle preflight requests
    if ($request_method = OPTIONS) {
        add_header Access-Control-Allow-Origin "https://pulsosocialv2-pulsosocialv2.dsb9vm.easypanel.host" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
        add_header Content-Length 0;
        add_header Content-Type text/plain;
        return 204;
    }
}
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
- [Kong CORS Plugin](https://docs.konghq.com/hub/kong-inc/cors/)
- [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Supabase GitHub - CORS Issues](https://github.com/supabase/supabase/issues?q=cors)