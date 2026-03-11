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

# Copy nginx configuration (no envsubst needed as nginx.conf has no variables)
cp /etc/nginx/conf.d/default.conf.template /etc/nginx/conf.d/default.conf
echo "nginx configuration copied"

echo "Environment variables injected successfully"
echo "Starting nginx..."

exec nginx -g 'daemon off;'