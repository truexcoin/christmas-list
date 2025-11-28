#!/bin/bash
# Complete VPS setup script for Christmas List App
# This script does EVERYTHING: installs dependencies, sets up the app, configures Nginx, etc.
# Usage: ./setup-vps.sh

set -e

echo "🎄 Christmas List App - Complete VPS Setup"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Get user inputs
read -p "Enter your admin password: " ADMIN_PASSWORD
read -p "Enter your domain name (or press Enter to use IP): " DOMAIN
read -p "Enter your Gemini API key (or press Enter to skip): " GEMINI_API_KEY

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)

echo ""
echo "📦 Step 1/8: Updating system packages..."
apt update && apt upgrade -y

echo ""
echo "📦 Step 2/8: Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo ""
echo "📦 Step 3/8: Installing PM2..."
npm install -g pm2

echo ""
echo "📦 Step 4/8: Installing Nginx..."
apt install -y nginx

echo ""
echo "📦 Step 5/8: Installing Redis..."
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server

echo ""
echo "📦 Step 6/8: Installing Git..."
apt install -y git

echo ""
echo "📦 Step 7/8: Cloning repository and setting up app..."
cd /var/www
if [ -d "christmas-list" ]; then
    echo "⚠️  Directory exists, pulling latest changes..."
    cd christmas-list
    git pull
else
    echo "📥 Cloning repository..."
    git clone https://github.com/truexcoin/christmas-list.git
    cd christmas-list
fi

echo ""
echo "📦 Installing npm dependencies..."
npm install --production

echo ""
echo "⚙️  Creating .env file..."
cat > .env << EOF
ADMIN_PASSWORD=${ADMIN_PASSWORD}
JWT_SECRET=${JWT_SECRET}
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=${GEMINI_API_KEY}
NODE_ENV=production
PORT=3000
EOF

echo ""
echo "🔨 Building application..."
npm run build

echo ""
echo "🚀 Starting application with PM2..."
pm2 start npm --name "christmas-list" -- start
pm2 save

# Setup PM2 to start on boot
PM2_STARTUP=$(pm2 startup | grep -oP 'sudo env PATH=.*$')
eval $PM2_STARTUP

echo ""
echo "🌐 Step 8/8: Configuring Nginx..."

# Create Nginx config
if [ -z "$DOMAIN" ]; then
    SERVER_NAME="_"
else
    SERVER_NAME="$DOMAIN www.$DOMAIN"
fi

cat > /etc/nginx/sites-available/christmas-list << EOF
server {
    listen 80;
    server_name ${SERVER_NAME};

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/christmas-list /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl restart nginx

echo ""
echo "🔥 Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
echo "y" | ufw enable

echo ""
echo "✅ Setup Complete!"
echo "=================="
echo ""
echo "📝 Your app is now running!"
if [ -z "$DOMAIN" ]; then
    echo "🌐 Access at: http://$(curl -s ifconfig.me)"
else
    echo "🌐 Access at: http://$DOMAIN"
    echo ""
    echo "🔒 To enable HTTPS, run:"
    echo "   apt install -y certbot python3-certbot-nginx"
    echo "   certbot --nginx -d $DOMAIN -d www.$DOMAIN"
fi
echo ""
echo "🔑 Admin panel: /admin"
echo "   Password: $ADMIN_PASSWORD"
echo ""
echo "📊 Useful commands:"
echo "   pm2 status              - Check app status"
echo "   pm2 logs christmas-list - View logs"
echo "   pm2 restart christmas-list - Restart app"
echo ""
echo "🔄 To update in the future, use: ./deploy.sh"

