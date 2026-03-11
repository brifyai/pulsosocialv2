#!/bin/sh
set -e

# Inject environment variables into the built JavaScript files
# This allows runtime environment variable injection for Docker containers

echo "Injecting environment variables..."

# Also create a window object with env vars for runtime access
cat > /usr/share/nginx/html/env.js << EOF
window.__ENV__ = {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL}",
  VITE_SUPABASE_ANON_KEY: "${VITE_SUPABASE_ANON_KEY}",
  VITE_CONVEX_URL: "${VITE_CONVEX_URL}"
};
EOF

# Process nginx configuration template with envsubst (even if no variables, ensures file is copied)
if [ -f /etc/nginx/conf.d/default.conf.template ]; then
  envsubst '${VITE_SUPABASE_URL} ${VITE_SUPABASE_ANON_KEY} ${VITE_CONVEX_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
  echo "nginx configuration processed"
else
  echo "Warning: nginx template not found"
fi

echo "Environment variables injected successfully"
echo "Starting nginx..."

# Start nginx
exec nginx -g 'daemon off;'