#!/bin/sh
set -e

echo "============================================"
echo "  Starting PulsoSocial v2..."
echo "============================================"
echo ""

# Remove any existing nginx config and copy our template
rm -f /etc/nginx/conf.d/default.conf
cp /etc/nginx/conf.d/default.conf.template /etc/nginx/conf.d/default.conf
echo "✓ Nginx configuration copied"
echo ""

# Verify the configuration includes the REST proxy location
if grep -q "location /rest/" /etc/nginx/conf.d/default.conf; then
    echo "✓ REST proxy location found in nginx config"
else
    echo "✗ WARNING: REST proxy location NOT found in nginx config!"
fi

echo ""
echo "============================================"
echo "  Starting nginx..."
echo "============================================"
echo ""

exec nginx -g 'daemon off;'