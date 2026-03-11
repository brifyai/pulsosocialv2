#!/bin/sh
set -e

echo "Injecting environment variables..."

# Create window object with env vars for runtime access
cat > /usr/share/nginx/html/env.js << EOF
window.__ENV__ = {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL}",
  VITE_SUPABASE_ANON_KEY: "${VITE_SUPABASE_ANON_KEY}",
  VITE_CONVEX_URL: "${VITE_CONVEX_URL}"
};
EOF

# Remove any existing nginx config and copy our template
rm -f /etc/nginx/conf.d/default.conf
cp /etc/nginx/conf.d/default.conf.template /etc/nginx/conf.d/default.conf
echo "nginx configuration copied"

# Verify the configuration includes the proxy location
if grep -q "location ^~ /supabase-proxy/" /etc/nginx/conf.d/default.conf; then
    echo "✓ Supabase proxy location found in nginx config"
else
    echo "✗ WARNING: Supabase proxy location NOT found in nginx config!"
fi

echo "Environment variables injected successfully"
echo "Starting nginx..."

exec nginx -g 'daemon off;'