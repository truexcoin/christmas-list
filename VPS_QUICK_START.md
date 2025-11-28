# 🚀 Quick Start Guide for Ubuntu VPS

Follow these steps on your Ubuntu VPS to get your Christmas List app running.

## Prerequisites

- Ubuntu 20.04+ or Debian 11+
- Root or sudo access
- SSH connection to your VPS

## Step-by-Step Instructions

### Step 1: Connect to Your VPS

```bash
ssh root@your-server-ip
# Or if using a user account:
ssh your-username@your-server-ip
```

### Step 2: Run the Automated Setup Script

```bash
# Navigate to /var/www
cd /var/www

# Clone the repository
git clone https://github.com/truexcoin/christmas-list.git

# Enter the project directory
cd christmas-list

# Make the setup script executable
chmod +x setup-vps.sh

# Run the setup script
sudo ./setup-vps.sh
```

### Step 3: Follow the Prompts

The script will ask you for:

1. **Admin Password** - Enter a secure password for your admin panel
2. **Domain Name** - Enter your domain (or press Enter to use IP address)
3. **Gemini API Key** - Enter your Google Gemini API key (or press Enter to skip)

The script will automatically:
- ✅ Install Node.js 20
- ✅ Install PM2, Nginx, Redis
- ✅ Set up environment variables
- ✅ Build the application
- ✅ Start the app with PM2
- ✅ Configure Nginx
- ✅ Set up firewall

### Step 4: Wait for Setup to Complete

The setup takes about 5-10 minutes. You'll see progress messages for each step.

### Step 5: Access Your App

Once setup is complete, your app will be available at:

- **If you used a domain:** `http://your-domain.com`
- **If you used IP:** `http://your-server-ip`

Visit `/admin` to access the admin panel.

### Step 6: (Optional) Set Up SSL/HTTPS

If you have a domain, enable HTTPS:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Follow the prompts. Certbot will automatically configure Nginx for HTTPS.

### Step 7: Migrate Your Data from Vercel

1. **Export from Vercel:**
   - Go to `https://your-vercel-site.vercel.app/admin`
   - Scroll to "Export/Import Data"
   - Click "Export Data"
   - Click "Copy to Clipboard" or "Download JSON File"

2. **Import to VPS:**
   - Go to `http://your-server-ip/admin` (or your domain)
   - Scroll to "Export/Import Data"
   - Paste the JSON data
   - Optionally check "Clear existing data before import"
   - Click "Import Data"
   - Wait for success message

## ✅ Verification

Check that everything is working:

```bash
# Check PM2 status
pm2 status

# Check app logs
pm2 logs christmas-list

# Check Redis
redis-cli ping  # Should return "PONG"

# Check Nginx
sudo systemctl status nginx

# Test the app
curl http://localhost:3000/api/status
```

## 🔄 Updating Your App

When you push changes to GitHub, update your VPS:

```bash
cd /var/www/christmas-list
./deploy.sh
```

Or manually:

```bash
cd /var/www/christmas-list
git pull
npm install
npm run build
pm2 restart christmas-list
```

**Note:** We use `npm install` (not `--production`) because dev dependencies like Tailwind CSS are needed for the build process.

## 🔑 Changing Admin Password

To change your admin password:

```bash
cd /var/www/christmas-list
nano .env
```

Find `ADMIN_PASSWORD=` and change the value, then:

```bash
pm2 restart christmas-list
```

See `VPS_ADMIN_PASSWORD.md` for detailed instructions.

## 📊 Useful Commands

```bash
# PM2 Management
pm2 status                    # Check app status
pm2 logs christmas-list      # View logs
pm2 restart christmas-list   # Restart app
pm2 stop christmas-list      # Stop app
npm run pm2:restart          # Restart (using npm script)

# Redis
redis-cli ping               # Test Redis
sudo systemctl status redis-server  # Check Redis status

# Nginx
sudo nginx -t                # Test Nginx config
sudo systemctl restart nginx # Restart Nginx

# View logs
tail -f /var/www/christmas-list/logs/pm2-out.log
tail -f /var/www/christmas-list/logs/pm2-error.log
```

## 🐛 Troubleshooting

### App won't start
```bash
pm2 logs christmas-list  # Check error logs
cd /var/www/christmas-list
npm run build  # Rebuild
pm2 restart christmas-list
```

### Can't access the site
```bash
# Check if app is running
pm2 status

# Check if Nginx is running
sudo systemctl status nginx

# Check firewall
sudo ufw status
```

### Redis connection issues
```bash
sudo systemctl start redis-server
redis-cli ping  # Should return "PONG"
```

### Permission issues
```bash
sudo chown -R $USER:$USER /var/www/christmas-list
chmod 755 /var/www/christmas-list/logs
```

## 📝 Important Files

- **App location:** `/var/www/christmas-list`
- **Environment variables:** `/var/www/christmas-list/.env`
- **PM2 logs:** `/var/www/christmas-list/logs/`
- **Nginx config:** `/etc/nginx/sites-available/christmas-list`
- **Redis data:** `/var/lib/redis/`

## 🎉 You're Done!

Your app should now be running on your VPS. Visit your domain or IP address to see it live!

For more detailed information, see `VPS_DEPLOY.md`.

