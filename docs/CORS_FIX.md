# Fix CORS en Supabase Self-Hosted (Kong)

## Problema

El frontend ya se conecta a Supabase, pero el **preflight OPTIONS** no recibe los headers CORS necesarios.

## Solución: Configurar Plugin CORS en Kong

### Opción 1: Admin API de Kong (Recomendado)

#### Paso 1: Abrir shell en el contenedor de Kong/Gateway

En EasyPanel:
1. Ve a tu servicio de Supabase → Contenedor `kong` o `gateway`
2. Click en **Shell** o **Exec**
3. Ejecuta los comandos siguientes

#### Paso 2: Verificar Admin API de Kong

```bash
# Verificar que Kong Admin API está disponible
curl -s http://127.0.0.1:8001/status
```

#### Paso 3: Listar servicios existentes

```bash
# Ver servicios disponibles
curl -s http://127.0.0.1:8001/services | jq
```

Deberías ver servicios como:
- `postgrest` o `rest` (API REST)
- `auth` (GoTrue)
- `storage` (File Storage)
- `realtime`

#### Paso 4: Crear Plugin CORS Global

```bash
# Plugin CORS global para todos los servicios
curl -sS -X POST http://127.0.0.1:8001/plugins \
  -d name=cors \
  -d 'config.origins=*' \
  -d 'config.methods=GET,POST,PUT,PATCH,DELETE,OPTIONS' \
  -d 'config.headers=Authorization,apikey,Content-Type,X-Client-Info,Prefer,Range' \
  -d 'config.exposed_headers=Content-Range,Content-Profile,Date,Content-Length' \
  -d 'config.credentials=true' \
  -d 'config.max_age=3600'
```

#### Paso 5: (Opcional) Restringir a tu origen específico

```bash
# Primero, eliminar el plugin anterior si existe
curl -s http://127.0.0.1:8001/plugins | jq '.data[] | select(.name=="cors") | .id'

# Luego crear con origen específico
curl -sS -X POST http://127.0.0.1:8001/plugins \
  -d name=cors \
  -d 'config.origins=https://pulsosocialv2-pulsosocialv2.dsb9vm.easypanel.host' \
  -d 'config.methods=GET,POST,PUT,PATCH,DELETE,OPTIONS' \
  -d 'config.headers=Authorization,apikey,Content-Type,X-Client-Info,Prefer,Range' \
  -d 'config.exposed_headers=Content-Range,Content-Profile,Date,Content-Length' \
  -d 'config.credentials=true' \
  -d 'config.max_age=3600'
```

### Opción 2: kong.yml (Configuración Declarativa)

Si tu Supabase usa `kong.yml`, edita el archivo:

```yaml
# kong.yml
plugins:
  - name: cors
    enabled: true
    config:
      origins:
        - https://pulsosocialv2-pulsosocialv2.dsb9vm.easypanel.host
      methods: [GET, POST, PUT, PATCH, DELETE, OPTIONS]
      headers: [Authorization, apikey, Content-Type, X-Client-Info, Prefer, Range]
      exposed_headers: [Content-Range, Content-Profile, Date, Content-Length]
      credentials: true
      max_age: 3600
```

Luego reinicia el servicio de Kong/gateway.

### Opción 3: Variables de Entorno (Puede no funcionar)

Algunas instalaciones de Supabase self-hosted permiten:

```env
# En las variables del servicio Kong/Gateway
KONG_CORS_ORIGINS=https://pulsosocialv2-pulsosocialv2.dsb9vm.easypanel.host
KONG_CORS_METHODS=GET,POST,PUT,PATCH,DELETE,OPTIONS
KONG_CORS_HEADERS=Authorization,apikey,Content-Type,X-Client-Info,Prefer,Range
```

**Nota:** Esto puede no funcionar si Kong no está configurado para leer estas variables.

## Validación

### Test 1: Preflight OPTIONS manual

```bash
curl -i -X OPTIONS \
  -H "Origin: https://pulsosocialv2-pulsosocialv2.dsb9vm.easypanel.host" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: apikey,authorization,content-type,x-client-info,prefer,range" \
  "https://pulsosocialv2-pulsosocialbdv3.dsb9vm.easypanel.host/rest/v1/agents"
```

**Respuesta esperada:**
```
HTTP/2 200 
access-control-allow-origin: https://pulsosocialv2-pulsosocialv2.dsb9vm.easypanel.host
access-control-allow-methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
access-control-allow-headers: Authorization, apikey, Content-Type, X-Client-Info, Prefer, Range
```

### Test 2: Desde el navegador

1. Abre tu aplicación en modo incógnito
2. F12 → Console
3. Deberías ver las peticiones a Supabase sin errores CORS

### Test 3: Ver plugins instalados

```bash
# Listar todos los plugins
curl -s http://127.0.0.1:8001/plugins | jq '.data[] | select(.name=="cors")'
```

## Comandos Útiles

```bash
# Listar todos los plugins
curl -s http://127.0.0.1:8001/plugins | jq

# Ver plugin CORS específico
curl -s http://127.0.0.1:8001/plugins | jq '.data[] | select(.name=="cors")'

# Eliminar plugin CORS (por ID)
curl -s -X DELETE http://127.0.0.1:8001/plugins/PLUGIN_ID

# Actualizar plugin CORS
curl -s -X PATCH http://127.0.0.1:8001/plugins/PLUGIN_ID \
  -d 'config.origins=https://pulsosocialv2-pulsosocialv2.dsb9vm.easypanel.host'
```

## Troubleshooting

### Error: "Failed to connect to 127.0.0.1 port 8001"

El Admin API puede estar en otro puerto o deshabilitado. Prueba:
```bash
# Puertos alternativos
curl http://localhost:8001/status
curl http://0.0.0.0:8001/status
```

### Error: "Plugin already exists"

Ya existe un plugin CORS. Actualízalo:
```bash
# Obtener ID del plugin
PLUGIN_ID=$(curl -s http://127.0.0.1:8001/plugins | jq -r '.data[] | select(.name=="cors") | .id')

# Actualizar
curl -s -X PATCH http://127.0.0.1:8001/plugins/$PLUGIN_ID \
  -d 'config.origins=*'
```

### CORS funciona pero hay 401/403

Esto es **RLS/permisos**, no CORS. Verifica:
- La tabla `agents` tiene políticas RLS que permiten lectura
- La `anon_key` es correcta

## Resumen de URLs

| Servicio | URL |
|----------|-----|
| Frontend | `https://pulsosocialv2-pulsosocialv2.dsb9vm.easypanel.host` |
| Supabase Gateway | `https://pulsosocialv2-pulsosocialbdv3.dsb9vm.easypanel.host` |
| Kong Admin API | `http://127.0.0.1:8001` (dentro del contenedor) |