#!/bin/bash

# =============================================================================
# Script para configurar CORS en Supabase Self-Hosted (Kong)
# =============================================================================
# Uso: ./fix-supabase-cors.sh
#
# Requisitos:
#   1. Tener acceso SSH al servidor donde corre Supabase
#   2. O tener docker CLI y poder ejecutar comandos en el contenedor
# =============================================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Fix CORS - Supabase Self-Hosted${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# URL del gateway de Supabase (cambiar si es diferente)
SUPABASE_GATEWAY="${SUPABASE_GATEWAY_URL:-https://pulsosocialv2-pulsosocialbdv3.dsb9vm.easypanel.host}"
FRONTEND_URL="${FRONTEND_URL:-https://pulsosocialv2-pulsosocialv2.dsb9vm.easypanel.host}"

echo -e "${YELLOW}Gateway de Supabase:${NC} $SUPABASE_GATEWAY"
echo -e "${YELLOW}Frontend URL:${NC} $FRONTEND_URL"
echo ""

# =============================================================================
# MÉTODO 1: Usando docker exec (si tienes acceso al servidor)
# =============================================================================
echo -e "${YELLOW}¿Tienes acceso SSH al servidor donde corre Supabase?${NC}"
echo "1) Sí, tengo acceso SSH y docker"
echo "2) No, necesito otra opción"
echo ""
read -p "Selecciona una opción (1-2): " METHOD

if [ "$METHOD" = "1" ]; then
    echo ""
    echo -e "${YELLOW}Buscando contenedor de Kong...${NC}"
    
    # Buscar contenedor de Kong
    KONG_CONTAINER=$(docker ps --format '{{.Names}}' | grep -E 'kong|gateway|supabase' | head -1)
    
    if [ -z "$KONG_CONTAINER" ]; then
        echo -e "${RED}No se encontró contenedor de Kong. Verifica que Supabase esté corriendo.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Contenedor encontrado:${NC} $KONG_CONTAINER"
    echo ""
    
    # Ejecutar comando CORS dentro del contenedor
    echo -e "${YELLOW}Configurando plugin CORS...${NC}"
    docker exec -it $KONG_CONTAINER /bin/sh -c "
        curl -sS -X POST http://127.0.0.1:8001/plugins \
          -d name=cors \
          -d 'config.origins=*' \
          -d 'config.methods=GET,POST,PUT,PATCH,DELETE,OPTIONS' \
          -d 'config.headers=Authorization,apikey,Content-Type,X-Client-Info,Prefer,Range' \
          -d 'config.exposed_headers=Content-Range,Content-Profile,Date,Content-Length' \
          -d 'config.credentials=true' \
          -d 'config.max_age=3600'
    "
    
    echo ""
    echo -e "${GREEN}✅ Plugin CORS configurado${NC}"
    
    # Verificar que se creó
    echo ""
    echo -e "${YELLOW}Verificando plugin instalado...${NC}"
    docker exec $KONG_CONTAINER /bin/sh -c "
        curl -s http://127.0.0.1:8001/plugins | grep -o '\"name\":\"cors\"' || echo 'No se encontró plugin CORS'
    "
    
elif [ "$METHOD" = "2" ]; then
    echo ""
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}  Opción: Ejecutar manualmente${NC}"
    echo -e "${YELLOW}========================================${NC}"
    echo ""
    echo "Sigue estos pasos en EasyPanel:"
    echo ""
    echo "1. Abre https://easypanel.io e inicia sesión"
    echo "2. Ve a tu proyecto → Servicio de Supabase"
    echo "3. Click en el contenedor 'kong' o 'gateway'"
    echo "4. Click en 'Shell' o 'Exec'"
    echo "5. Pega y ejecuta este comando:"
    echo ""
    echo -e "${GREEN}----------------------------------------${NC}"
    echo "curl -sS -X POST http://127.0.0.1:8001/plugins \\"
    echo "  -d name=cors \\"
    echo "  -d 'config.origins=*' \\"
    echo "  -d 'config.methods=GET,POST,PUT,PATCH,DELETE,OPTIONS' \\"
    echo "  -d 'config.headers=Authorization,apikey,Content-Type,X-Client-Info,Prefer,Range' \\"
    echo "  -d 'config.exposed_headers=Content-Range,Content-Profile,Date,Content-Length' \\"
    echo "  -d 'config.credentials=true' \\"
    echo "  -d 'config.max_age=3600'"
    echo -e "${GREEN}----------------------------------------${NC}"
    echo ""
    
    # Test de validación
    echo "¿Ya ejecutaste el comando? (y/n)"
    read -p "> " CONFIRM
    
    if [ "$CONFIRM" = "y" ]; then
        echo ""
        echo -e "${YELLOW}Ejecutando test de validación...${NC}"
        echo ""
        
        # Test preflight OPTIONS
        echo -e "${YELLOW}Test: Preflight OPTIONS${NC}"
        curl -i -X OPTIONS \
          -H "Origin: $FRONTEND_URL" \
          -H "Access-Control-Request-Method: GET" \
          -H "Access-Control-Request-Headers: apikey,authorization" \
          "$SUPABASE_GATEWAY/rest/v1/agents" 2>/dev/null | head -20
        
        echo ""
        echo -e "${GREEN}✅ Test completado${NC}"
        echo ""
        echo "Busca estos headers en la respuesta:"
        echo "  - Access-Control-Allow-Origin: *"
        echo "  - Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS"
        echo "  - Access-Control-Allow-Headers: Authorization, apikey, ..."
    fi
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ¡Listo!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Ahora prueba tu aplicación en el navegador:"
echo "  1. Abre en modo incógnito"
echo "  2. F12 → Console"
echo "  3. No deberías ver errores de CORS"