#!/bin/bash
# Quick deployment script for VPS
# Usage: ./deploy.sh

set -e

echo "🚀 Deploying Christmas List App..."
echo "=================================="
echo ""

cd /var/www/christmas-list || { echo "❌ Directory not found. Make sure you've cloned the repo to /var/www/christmas-list"; exit 1; }

# Pre-deployment checks
echo "🔍 Pre-deployment checks..."
if ! pm2 list | grep -q "christmas-list"; then
    echo "⚠️  App not running in PM2. Will start it after deployment."
fi

# Check Redis
if ! redis-cli ping > /dev/null 2>&1; then
    echo "⚠️  Redis is not running. Starting Redis..."
    sudo systemctl start redis-server || echo "❌ Failed to start Redis. Please check manually."
fi

echo ""
echo "📥 Pulling latest changes..."
git pull

echo ""
echo "📦 Installing dependencies..."
npm install --production

echo ""
echo "🔨 Building application (standalone mode)..."
npm run build

# Verify build
if [ ! -d ".next" ]; then
    echo "❌ Build failed! Check the output above for errors."
    exit 1
fi

echo ""
echo "🔄 Restarting application with PM2..."
# Stop existing instance
pm2 stop christmas-list 2>/dev/null || true

# Check if standalone build exists, otherwise use npm start
if [ -f ".next/standalone/server.js" ]; then
    echo "✅ Using standalone build (optimized)"
    pm2 start ecosystem.config.js || pm2 restart christmas-list
else
    echo "⚠️  Standalone build not found, using npm start"
    pm2 start npm --name "christmas-list" -- start || pm2 restart christmas-list
fi

# Save PM2 configuration
pm2 save

echo ""
echo "⏳ Waiting for app to start..."
sleep 3

# Health check
echo ""
echo "🏥 Running health check..."
if curl -f http://localhost:3000/api/status > /dev/null 2>&1; then
    echo "✅ App is running and healthy!"
else
    echo "⚠️  Health check failed. App might still be starting."
    echo "📝 Check logs with: pm2 logs christmas-list"
fi

echo ""
echo "✅ Deployment complete!"
echo "========================"
echo ""
echo "📊 Check status with: pm2 status"
echo "📝 View logs with: pm2 logs christmas-list"
echo "🔄 Restart manually: pm2 restart christmas-list"

