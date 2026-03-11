#!/bin/sh
set -e

echo "============================================"
echo "  Injecting environment variables..."
echo "============================================"
echo ""

# Debug: Print ALL environment variables (filtered for security)
echo "DEBUG: All environment variables:"
env | grep -E "^(VITE_|REACT_APP_|SUPABASE|CONVEX|URL|KEY)" | sed 's/KEY=.*/KEY=***/' | sed 's/PASS=.*/PASS=***/'
echo ""

# Debug: Print specific variables we need
echo "DEBUG: Specific variables:"
echo "  VITE_SUPABASE_URL='${VITE_SUPABASE_URL:-'(NOT SET)'}'"
echo "  VITE_CONVEX_URL='${VITE_CONVEX_URL:-'(NOT SET)'}'"
echo "  VITE_SUPABASE_ANON_KEY='${VITE_SUPABASE_ANON_KEY:+***SET***}${VITE_SUPABASE_ANON_KEY:-'(NOT SET)'}'"
echo ""

# Use default production values if not set
# This ensures the app works even if EasyPanel doesn't pass all variables
SUPABASE_URL_TO_USE="${VITE_SUPABASE_URL:-https://pulsosocialv2-pulsosocialbdv3.dsb9vm.easypanel.host}"
SUPABASE_KEY_TO_USE="${VITE_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1bHNvc29jaWFsdjItcHVsc29zb2NpYWxidjMiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc0MTcwMjQ1NCwiZXhwIjoxNzU3MjU4NDU0fQ.Cf6U3eP7G0FKlJXG8KqQvZzJxL6LqKqKqKqKqKqKqKq}"
CONVEX_URL_TO_USE="${VITE_CONVEX_URL:-https://blessed-anaconda-376.convex.cloud}"

echo "Using values:"
echo "  VITE_SUPABASE_URL: ${SUPABASE_URL_TO_USE}"
echo "  VITE_CONVEX_URL: ${CONVEX_URL_TO_USE}"
echo "  VITE_SUPABASE_ANON_KEY: ***set***"
echo ""

# Create window object with env vars for runtime access
# This allows changing URLs without rebuild
cat > /usr/share/nginx/html/env.js << EOF
window.__ENV__ = {
  VITE_SUPABASE_URL: "${SUPABASE_URL_TO_USE}",
  VITE_SUPABASE_ANON_KEY: "${SUPABASE_KEY_TO_USE}",
  VITE_CONVEX_URL: "${CONVEX_URL_TO_USE}"
};
EOF

echo "env.js created with:"
echo "  VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:-'(empty)'}"
echo "  VITE_CONVEX_URL: ${VITE_CONVEX_URL:-'(empty)'}"
echo "  VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY:+'***set***'}${VITE_SUPABASE_ANON_KEY:-'(empty)'}"
echo ""

# Also create a JSON version for other potential uses
cat > /usr/share/nginx/html/config.json << EOF
{
  "VITE_SUPABASE_URL": "${VITE_SUPABASE_URL}",
  "VITE_SUPABASE_ANON_KEY": "${VITE_SUPABASE_ANON_KEY}",
  "VITE_CONVEX_URL": "${VITE_CONVEX_URL}"
}
EOF

echo "config.json created"
echo ""

# Remove any existing nginx config and copy our template
rm -f /etc/nginx/conf.d/default.conf
cp /etc/nginx/conf.d/default.conf.template /etc/nginx/conf.d/default.conf
echo "nginx configuration copied"
echo ""

# Verify the configuration includes the REST proxy location
if grep -q "location /rest/" /etc/nginx/conf.d/default.conf; then
    echo "✓ REST proxy location found in nginx config"
else
    echo "✗ WARNING: REST proxy location NOT found in nginx config!"
fi

echo ""
echo "============================================"
echo "  Environment variables injected successfully"
echo "============================================"
echo ""
echo "Starting nginx..."
echo ""

exec nginx -g 'daemon off;'