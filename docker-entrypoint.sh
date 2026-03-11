#!/bin/sh
set -e

echo "============================================"
echo "  Injecting environment variables..."
echo "============================================"
echo ""

# Create window object with env vars for runtime access
# This allows changing URLs without rebuild
cat > /usr/share/nginx/html/env.js << EOF
window.__ENV__ = {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL}",
  VITE_SUPABASE_ANON_KEY: "${VITE_SUPABASE_ANON_KEY}",
  VITE_CONVEX_URL: "${VITE_CONVEX_URL}"
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