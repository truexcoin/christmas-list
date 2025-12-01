#!/bin/bash
# Quick script to fix Nginx config to only respond to subdomain
# Run this on your VPS after updating the code

set -e

echo "🔧 Fixing Nginx configuration for subdomain-only access..."
echo "=========================================================="
echo ""

# Backup current config
if [ -f /etc/nginx/sites-available/christmas-list ]; then
    echo "📋 Backing up current config..."
    sudo cp /etc/nginx/sites-available/christmas-list /etc/nginx/sites-available/christmas-list.backup.$(date +%Y%m%d_%H%M%S)
fi

# Update Christmas list config to only use subdomain
echo "✏️  Updating Christmas list config..."
sudo tee /etc/nginx/sites-available/christmas-list > /dev/null << 'EOF'
server {
    listen 80;
    server_name list.truexsystems.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

echo ""
echo "✅ Christmas list config updated to only respond to list.truexsystems.com"
echo ""
echo "⚠️  IMPORTANT: Make sure your root domain site has 'default_server'"
echo "   Edit your root domain config and add 'default_server' to the listen line:"
echo "   listen 80 default_server;"
echo ""
echo "📝 To edit root domain config, run:"
echo "   sudo nano /etc/nginx/sites-available/truexsystems.com"
echo "   (or whatever file your root domain uses)"
echo ""

# Test configuration
echo "🧪 Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✅ Configuration is valid!"
    echo ""
    read -p "Reload Nginx now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo systemctl reload nginx
        echo "✅ Nginx reloaded!"
    else
        echo "⚠️  Skipped reload. Run 'sudo systemctl reload nginx' when ready."
    fi
else
    echo "❌ Configuration test failed! Please check the errors above."
    exit 1
fi

echo ""
echo "✅ Done!"
echo ""
echo "🧪 Test with:"
echo "   curl -H 'Host: list.truexsystems.com' http://localhost/api/status"
echo "   curl -H 'Host: truexsystems.com' http://localhost"

