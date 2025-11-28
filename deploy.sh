#!/bin/bash
# Quick deployment script for VPS
# Usage: ./deploy.sh

set -e

echo "🚀 Deploying Christmas List App..."

cd /var/www/christmas-list || { echo "❌ Directory not found. Make sure you've cloned the repo to /var/www/christmas-list"; exit 1; }

echo "📥 Pulling latest changes..."
git pull

echo "📦 Installing dependencies..."
npm install --production

echo "🔨 Building application..."
npm run build

echo "🔄 Restarting application..."
pm2 restart christmas-list || pm2 start npm --name "christmas-list" -- start

echo "✅ Deployment complete!"
echo "📊 Check status with: pm2 status"
echo "📝 View logs with: pm2 logs christmas-list"

