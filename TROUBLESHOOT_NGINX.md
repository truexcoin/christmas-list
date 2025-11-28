# Troubleshooting: Site Not Loading

## Step 1: Check if App is Running

```bash
pm2 status
```

If you see `christmas-list` with status `online`, the app is running.
If not, start it:

```bash
cd /var/www/christmas-list
pm2 start ecosystem.config.js
pm2 save
```

## Step 2: Check App Logs

```bash
pm2 logs christmas-list --lines 50
```

Look for any errors.

## Step 3: Test Direct Connection to App

```bash
curl http://localhost:3000/api/status
```

If this works, your app is running. If not, the app might have crashed.

## Step 4: Check Nginx Status

```bash
sudo systemctl status nginx
```

Should show `active (running)`.

## Step 5: Check Nginx Configuration

```bash
# View current config
sudo cat /etc/nginx/sites-available/christmas-list

# Check if it's enabled
ls -la /etc/nginx/sites-enabled/
```

## Step 6: Test Nginx Configuration

```bash
sudo nginx -t
```

Should say "syntax is ok" and "test is successful".

## Step 7: Check Nginx Error Logs

```bash
sudo tail -f /var/log/nginx/error.log
```

## Step 8: Restart Everything

```bash
# Restart app
pm2 restart christmas-list

# Restart Nginx
sudo systemctl restart nginx

# Check status
pm2 status
sudo systemctl status nginx
```

## Common Issues

### App Not Running
```bash
cd /var/www/christmas-list
pm2 start ecosystem.config.js
```

### Port 3000 Not Accessible
```bash
# Check if port is in use
sudo netstat -tlnp | grep 3000
```

### Nginx Config Error
```bash
sudo nginx -t
# Fix any errors shown
sudo systemctl reload nginx
```

