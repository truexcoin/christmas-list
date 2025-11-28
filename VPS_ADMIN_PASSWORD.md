# Changing Admin Password on VPS

## Quick Method

```bash
cd /var/www/christmas-list

# Edit the .env file
nano .env
```

Find the line:
```
ADMIN_PASSWORD=your-current-password
```

Change it to your new password:
```
ADMIN_PASSWORD=your-new-password
```

Save and exit (Ctrl+X, then Y, then Enter).

Then restart the app:
```bash
pm2 restart christmas-list
```

## Alternative: Using sed (Command Line)

```bash
cd /var/www/christmas-list

# Replace OLD_PASSWORD with your new password
sed -i 's/ADMIN_PASSWORD=.*/ADMIN_PASSWORD=your-new-password/' .env

# Restart the app
pm2 restart christmas-list
```

## Verify the Change

1. Visit your admin panel: `http://your-server-ip/admin`
2. Try logging in with your new password
3. If it doesn't work, check the logs: `pm2 logs christmas-list`

## Security Tips

- Use a strong password (mix of letters, numbers, symbols)
- Don't share your `.env` file
- The password is stored in plain text in `.env` (this is normal for this setup)

