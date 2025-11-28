#!/bin/bash
# Diagnostic script for VPS troubleshooting
# Run this on your VPS: chmod +x diagnose.sh && ./diagnose.sh

echo "=========================================="
echo "VPS Diagnostic Report"
echo "=========================================="
echo ""

echo "1. PM2 Status:"
echo "----------------------------------------"
pm2 status
echo ""

echo "2. App Direct Connection Test:"
echo "----------------------------------------"
curl -s http://localhost:3000/api/status || echo "❌ App not responding on port 3000"
echo ""

echo "3. Port 3000 Check:"
echo "----------------------------------------"
sudo netstat -tlnp | grep 3000 || echo "❌ Nothing listening on port 3000"
echo ""

echo "4. Nginx Status:"
echo "----------------------------------------"
sudo systemctl status nginx --no-pager | head -10
echo ""

echo "5. Nginx Configuration:"
echo "----------------------------------------"
sudo cat /etc/nginx/sites-available/christmas-list
echo ""

echo "6. Enabled Nginx Sites:"
echo "----------------------------------------"
ls -la /etc/nginx/sites-enabled/
echo ""

echo "7. Nginx Test:"
echo "----------------------------------------"
sudo nginx -t
echo ""

echo "8. Nginx Proxy Test:"
echo "----------------------------------------"
curl -s -H "Host: list.truexsystems.com" http://localhost/api/status || echo "❌ Nginx proxy not working"
echo ""

echo "9. Recent Nginx Error Logs:"
echo "----------------------------------------"
sudo tail -20 /var/log/nginx/error.log
echo ""

echo "10. Recent App Logs:"
echo "----------------------------------------"
pm2 logs christmas-list --lines 20 --nostream
echo ""

echo "11. Environment Check:"
echo "----------------------------------------"
cd /var/www/christmas-list
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo ".env file exists: $([ -f .env ] && echo 'Yes' || echo 'No')"
echo ""

echo "12. Build Check:"
echo "----------------------------------------"
echo ".next directory exists: $([ -d .next ] && echo 'Yes' || echo 'No')"
echo "Standalone build exists: $([ -d .next/standalone ] && echo 'Yes' || echo 'No')"
echo ""

echo "=========================================="
echo "Diagnostic Complete"
echo "=========================================="

