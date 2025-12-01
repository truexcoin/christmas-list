# Fix Nginx: Christmas List Showing on Root Domain

If your Christmas list app is showing up on `truexsystems.com` instead of only `list.truexsystems.com`, follow these steps:

## Quick Fix on VPS

SSH into your VPS and run:

```bash
# Edit the Christmas list Nginx config
sudo nano /etc/nginx/sites-available/christmas-list
```

Make sure it **ONLY** has `list.truexsystems.com` in the `server_name`:

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

**Important:** The `server_name` should ONLY be `list.truexsystems.com` - NOT `truexsystems.com` or `www.truexsystems.com`.

Save and exit (Ctrl+X, Y, Enter).

## Configure Your Root Domain Site

Now make sure your root domain site has `default_server` so it catches all other requests:

```bash
# Edit your root domain site config (this might be in a different file)
sudo nano /etc/nginx/sites-available/truexsystems.com
# or
sudo nano /etc/nginx/sites-available/default
```

Add `default_server` to the `listen` directive:

```nginx
server {
    listen 80 default_server;
    server_name truexsystems.com www.truexsystems.com;

    # ... your root site configuration ...
}
```

## Test and Reload

```bash
# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

## Verify

Test that each site responds correctly:

```bash
# Should show your root domain site
curl -H "Host: truexsystems.com" http://localhost

# Should show your Christmas list app
curl -H "Host: list.truexsystems.com" http://localhost
```

## Check All Nginx Sites

To see all enabled sites:

```bash
ls -la /etc/nginx/sites-enabled/
```

Make sure:
- Christmas list site only has `list.truexsystems.com` in `server_name`
- Root domain site has `default_server` and `truexsystems.com` in `server_name`
- Only one site has `default_server` on port 80

## SSL/HTTPS

If you have SSL certificates, make sure Certbot updated both sites correctly:

```bash
# Check certificates
sudo certbot certificates

# If needed, update the Christmas list SSL
sudo certbot --nginx -d list.truexsystems.com

# Update root domain SSL
sudo certbot --nginx -d truexsystems.com -d www.truexsystems.com
```

After SSL setup, Certbot will create separate server blocks for port 443 (HTTPS). Make sure those also have the correct `server_name` values.

