# Setting Up Cloudflare Domain for VPS

This guide shows you how to connect your VPS app to your Cloudflare domain `truexsystems.com`.

## Option 1: Subdomain (Recommended - Easier)

Use `list.truexsystems.com` - this is simpler and doesn't require Next.js configuration changes.

### Step 1: Configure DNS in Cloudflare

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain: `truexsystems.com`
3. Go to **DNS** → **Records**
4. Click **Add record**
5. Configure:
   - **Type:** `A`
   - **Name:** `list`
   - **IPv4 address:** `your-vps-ip-address`
   - **Proxy status:** Proxied (orange cloud) or DNS only (gray cloud)
   - Click **Save**

### Step 2: Update Nginx Configuration on VPS

```bash
cd /var/www/christmas-list

# Edit Nginx config
sudo nano /etc/nginx/sites-available/christmas-list
```

Replace the content with:

```nginx
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
```

Save and exit (Ctrl+X, Y, Enter).

### Step 3: Test and Reload Nginx

```bash
# Test configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

### Step 4: Set Up SSL (HTTPS)

```bash
# Install Certbot if not already installed
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d list.truexsystems.com

# Follow the prompts
# - Enter your email
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

### Step 5: Verify

Visit: `https://list.truexsystems.com`

---

## Option 2: Path (truexsystems.com/list)

This requires Next.js configuration changes to support a base path.

### Step 1: Update Next.js Configuration

On your VPS:

```bash
cd /var/www/christmas-list
nano next.config.mjs
```

Update to:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  basePath: '/list',
  assetPrefix: '/list',
};

export default nextConfig;
```

### Step 2: Rebuild the Application

```bash
npm run build
pm2 restart christmas-list
```

### Step 3: Configure DNS in Cloudflare

1. Go to Cloudflare Dashboard → DNS → Records
2. Add/Update A record:
   - **Type:** `A`
   - **Name:** `@` (or root domain)
   - **IPv4 address:** `your-vps-ip-address`
   - **Proxy status:** Proxied or DNS only
   - Click **Save**

### Step 4: Update Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/christmas-list
```

Replace with:

```nginx
server {
    listen 80;
    server_name truexsystems.com www.truexsystems.com;

    location /list {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Rewrite paths to remove /list prefix for the app
        rewrite ^/list/?(.*)$ /$1 break;
    }

    # Optional: Redirect root to /list
    location = / {
        return 301 /list;
    }
}
```

### Step 5: Test and Reload

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Step 6: Set Up SSL

```bash
sudo certbot --nginx -d truexsystems.com -d www.truexsystems.com
```

### Step 7: Verify

Visit: `https://truexsystems.com/list`

---

## Which Option Should You Choose?

**Option 1 (Subdomain)** is recommended because:
- ✅ No Next.js configuration changes needed
- ✅ Easier to set up
- ✅ Cleaner URLs
- ✅ Less likely to have path issues

**Option 2 (Path)** if:
- You want everything under the main domain
- You have other apps/services on the same domain
- You prefer the `/list` path structure

---

## Troubleshooting

### DNS Not Working

1. Check DNS propagation: `nslookup list.truexsystems.com`
2. Verify Cloudflare proxy is enabled (orange cloud)
3. Wait a few minutes for DNS to propagate

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew manually if needed
sudo certbot renew
```

### App Not Loading

```bash
# Check if app is running
pm2 status

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Check app logs
pm2 logs christmas-list

# Test local connection
curl http://localhost:3000/api/status
```

### Cloudflare Proxy Issues

If you're using Cloudflare's proxy (orange cloud):
- Make sure SSL/TLS mode is set to "Full" or "Full (strict)" in Cloudflare
- The VPS should have a valid SSL certificate (from Let's Encrypt)

---

## Quick Reference

**For Subdomain (list.truexsystems.com):**
- DNS: A record `list` → VPS IP
- Nginx: `server_name list.truexsystems.com;`
- SSL: `certbot --nginx -d list.truexsystems.com`

**For Path (truexsystems.com/list):**
- DNS: A record `@` → VPS IP  
- Next.js: Add `basePath: '/list'` to `next.config.mjs`
- Nginx: Location block for `/list`
- SSL: `certbot --nginx -d truexsystems.com -d www.truexsystems.com`

