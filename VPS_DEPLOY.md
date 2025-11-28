# Deploying to a VPS

A VPS gives you full control and avoids the complexity of Cloudflare Pages adapters. This guide covers deploying your Christmas List app to a VPS.

## 🎯 VPS Provider Recommendations

### Budget Options ($3-6/month)
- **DigitalOcean** - $6/month (1GB RAM, 1 vCPU) - [digitalocean.com](https://www.digitalocean.com)
- **Vultr** - $6/month (1GB RAM, 1 vCPU) - [vultr.com](https://www.vultr.com)
- **Linode** - $5/month (1GB RAM, 1 vCPU) - [linode.com](https://www.linode.com)
- **Hetzner** - €4/month (~$4.50) - [hetzner.com](https://www.hetzner.com) (Europe-based)

### Free Tier Options
- **Oracle Cloud** - Always Free tier (1GB RAM) - [oracle.com/cloud](https://www.oracle.com/cloud)
- **Google Cloud** - $300 free credit - [cloud.google.com](https://cloud.google.com)

## 📋 Prerequisites

1. A VPS with Ubuntu 20.04+ or Debian 11+
2. SSH access to your VPS
3. A domain name (optional, but recommended)

## 🚀 Step-by-Step Deployment

### Step 1: Initial Server Setup

SSH into your VPS:

```bash
ssh root@your-server-ip
```

Update the system:

```bash
apt update && apt upgrade -y
```

### Step 2: Install Node.js

Install Node.js 20 (LTS):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

Verify installation:

```bash
node --version  # Should show v20.x.x
npm --version
```

### Step 3: Install PM2 (Process Manager)

PM2 keeps your app running and restarts it if it crashes:

```bash
npm install -g pm2
```

### Step 4: Install Nginx (Web Server)

```bash
apt install -y nginx
```

### Step 5: Install Redis (Optional but Recommended)

For persistent storage:

```bash
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server
```

Verify Redis is running:

```bash
redis-cli ping  # Should return "PONG"
```

### Step 6: Clone Your Repository

```bash
cd /var/www
git clone https://github.com/truexcoin/christmas-list.git
cd christmas-list
```

### Step 7: Install Dependencies

```bash
npm install --production
```

### Step 8: Set Up Environment Variables

Create a `.env` file:

```bash
nano .env
```

Add your environment variables:

```env
ADMIN_PASSWORD=your-secure-password-here
JWT_SECRET=your-random-secret-key-here
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your-gemini-api-key-here
NODE_ENV=production
PORT=3000
```

**Generate a secure JWT_SECRET:**

```bash
openssl rand -base64 32
```

Save and exit (Ctrl+X, then Y, then Enter).

### Step 9: Build the Application

```bash
npm run build
```

### Step 10: Start with PM2

```bash
pm2 start npm --name "christmas-list" -- start
pm2 save
pm2 startup
```

The last command will show you a command to run - copy and run it to enable PM2 on boot.

### Step 11: Configure Nginx

Create an Nginx configuration file:

```bash
nano /etc/nginx/sites-available/christmas-list
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

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
```

If you don't have a domain, use your server IP:

```nginx
server {
    listen 80;
    server_name _;

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
```

Enable the site:

```bash
ln -s /etc/nginx/sites-available/christmas-list /etc/nginx/sites-enabled/
nginx -t  # Test configuration
systemctl restart nginx
```

### Step 12: Set Up SSL with Let's Encrypt (Optional but Recommended)

Install Certbot:

```bash
apt install -y certbot python3-certbot-nginx
```

Get SSL certificate (replace with your domain):

```bash
certbot --nginx -d your-domain.com -d www.your-domain.com
```

Follow the prompts. Certbot will automatically configure Nginx for HTTPS.

### Step 13: Configure Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

## 🔄 Updating Your Application

To update your app when you push changes to GitHub:

```bash
cd /var/www/christmas-list
git pull
npm install --production
npm run build
pm2 restart christmas-list
```

## 📊 Monitoring

### Check PM2 Status

```bash
pm2 status
pm2 logs christmas-list
pm2 monit
```

### Check Nginx Status

```bash
systemctl status nginx
```

### Check Redis Status

```bash
systemctl status redis-server
redis-cli ping
```

## 🛠️ Useful Commands

### PM2 Commands

```bash
pm2 restart christmas-list    # Restart app
pm2 stop christmas-list       # Stop app
pm2 delete christmas-list     # Remove from PM2
pm2 logs christmas-list       # View logs
pm2 monit                     # Monitor resources
```

### Nginx Commands

```bash
nginx -t                      # Test configuration
systemctl restart nginx       # Restart Nginx
systemctl reload nginx        # Reload configuration
```

### Redis Commands

```bash
redis-cli                     # Open Redis CLI
redis-cli FLUSHALL            # Clear all data (careful!)
systemctl restart redis-server
```

## 🔒 Security Best Practices

1. **Change SSH port** (optional but recommended):
   ```bash
   nano /etc/ssh/sshd_config
   # Change Port 22 to Port 2222 (or another port)
   systemctl restart sshd
   ```

2. **Set up fail2ban** (protects against brute force):
   ```bash
   apt install -y fail2ban
   systemctl enable fail2ban
   systemctl start fail2ban
   ```

3. **Keep system updated**:
   ```bash
   apt update && apt upgrade -y
   ```

4. **Use strong passwords** for ADMIN_PASSWORD and JWT_SECRET

5. **Regular backups** of your Redis data:
   ```bash
   redis-cli SAVE
   cp /var/lib/redis/dump.rdb /backup/redis-$(date +%Y%m%d).rdb
   ```

## 💰 Cost Comparison

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| **VPS (DigitalOcean)** | $6 | Full control, 1GB RAM |
| **VPS (Hetzner)** | €4 (~$4.50) | Europe-based, great value |
| **Vercel** | Free (limited) | 100GB bandwidth, 100 hours build |
| **Cloudflare Pages** | Free | Unlimited requests, but complex setup |

**VPS Advantages:**
- ✅ Full control
- ✅ No build time limits
- ✅ Can run Redis locally
- ✅ No API route limitations
- ✅ Can host multiple apps

**VPS Disadvantages:**
- ❌ You manage updates/security
- ❌ Need to set up SSL yourself
- ❌ Slightly more complex initial setup

## 🐛 Troubleshooting

### App won't start

```bash
pm2 logs christmas-list  # Check logs
cd /var/www/christmas-list
npm run build  # Rebuild
pm2 restart christmas-list
```

### Nginx 502 Bad Gateway

- Check if app is running: `pm2 status`
- Check app logs: `pm2 logs christmas-list`
- Verify port 3000 is correct in Nginx config

### Redis connection issues

```bash
systemctl status redis-server
redis-cli ping
# If not running:
systemctl start redis-server
```

### Out of memory

If your VPS has limited RAM (1GB), you might need to:
- Use swap space
- Optimize Node.js memory: `NODE_OPTIONS=--max-old-space-size=512`
- Consider upgrading to 2GB RAM

## 📝 Quick Setup Script

Save this as `setup.sh` and run it on a fresh Ubuntu server:

```bash
#!/bin/bash
set -e

echo "🚀 Setting up Christmas List App on VPS..."

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2
npm install -g pm2

# Install Nginx
apt install -y nginx

# Install Redis
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server

# Install Git
apt install -y git

echo "✅ Setup complete! Now:"
echo "1. Clone your repo: cd /var/www && git clone https://github.com/truexcoin/christmas-list.git"
echo "2. cd christmas-list && npm install --production"
echo "3. Create .env file with your environment variables"
echo "4. npm run build"
echo "5. pm2 start npm --name 'christmas-list' -- start"
echo "6. Configure Nginx (see guide above)"
```

Make it executable and run:

```bash
chmod +x setup.sh
./setup.sh
```

## 🎉 You're Done!

Your app should now be accessible at:
- `http://your-server-ip` (if no domain)
- `https://your-domain.com` (if you set up SSL)

Visit your admin panel at `/admin` and start adding gifts!

