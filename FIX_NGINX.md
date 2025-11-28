# Fix Nginx Configuration

If you see the default Nginx welcome page, the configuration needs to be fixed.

## Quick Fix

Run these commands on your VPS:

```bash
# Check current Nginx config
sudo nano /etc/nginx/sites-available/christmas-list
```

Make sure it contains:

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

Then:

```bash
# Remove default site if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# Make sure your site is enabled
sudo ln -sf /etc/nginx/sites-available/christmas-list /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

## Verify

```bash
# Check if your app is running
pm2 status

# Test direct connection
curl http://localhost:3000/api/status

# Test through Nginx
curl -H "Host: list.truexsystems.com" http://localhost/api/status
```

If the last command works, your domain should work too!

