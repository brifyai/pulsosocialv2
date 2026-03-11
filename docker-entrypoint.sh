#!/bin/sh
set -e

# Inject environment variables into the built JavaScript files
# This allows runtime environment variable injection for Docker containers

echo "Injecting environment variables..."

# Replace placeholders in JS files with actual environment values
if [ -n "$VITE_SUPABASE_URL" ]; then
  find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|__SUPABASE_URL__|$VITE_SUPABASE_URL|g" {} \;
fi

if [ -n "$VITE_SUPABASE_ANON_KEY" ]; then
  find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|__SUPABASE_ANON_KEY__|$VITE_SUPABASE_ANON_KEY|g" {} \;
fi

# Also create a window object with env vars for runtime access
cat > /usr/share/nginx/html/env.js << EOF
window.__ENV__ = {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL}",
  VITE_SUPABASE_ANON_KEY: "${VITE_SUPABASE_ANON_KEY}",
  VITE_CONVEX_URL: "${VITE_CONVEX_URL}"
};
EOF

echo "Environment variables injected successfully"
echo "Starting nginx..."

# Start nginx
exec nginx -g 'daemon off;'