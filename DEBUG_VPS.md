# Debug VPS Step-by-Step

Run these commands in order and share the output:

## Step 1: Check if App is Running

```bash
pm2 status
```

**Expected:** Should show `christmas-list` with status `online`

## Step 2: Check App Logs

```bash
pm2 logs christmas-list --lines 30
```

**Look for:** Any error messages

## Step 3: Test App Directly

```bash
curl http://localhost:3000/api/status
```

**Expected:** Should return JSON with status info

## Step 4: Check if Port 3000 is Listening

```bash
sudo netstat -tlnp | grep 3000
```

**Expected:** Should show Node.js process listening on port 3000

## Step 5: Check Nginx Status

```bash
sudo systemctl status nginx
```

**Expected:** Should show `active (running)`

## Step 6: Check Nginx Configuration

```bash
sudo nginx -t
```

**Expected:** Should say "syntax is ok" and "test is successful"

## Step 7: View Nginx Config

```bash
sudo cat /etc/nginx/sites-available/christmas-list
```

**Check:** Should have `proxy_pass http://localhost:3000;`

## Step 8: Check if Site is Enabled

```bash
ls -la /etc/nginx/sites-enabled/
```

**Expected:** Should see `christmas-list` symlink

## Step 9: Check Nginx Error Logs

```bash
sudo tail -30 /var/log/nginx/error.log
```

**Look for:** Any error messages

## Step 10: Test Nginx Proxy

```bash
curl -H "Host: list.truexsystems.com" http://localhost/api/status
```

**Expected:** Should return same JSON as step 3

## Quick Fixes

### If app isn't running:
```bash
cd /var/www/christmas-list
pm2 start ecosystem.config.js
pm2 save
```

### If Nginx config is wrong:
```bash
sudo nano /etc/nginx/sites-available/christmas-list
# Make sure it has: proxy_pass http://localhost:3000;
sudo nginx -t
sudo systemctl reload nginx
```

### If default site is still enabled:
```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/christmas-list /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

