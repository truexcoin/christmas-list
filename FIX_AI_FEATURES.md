# Fix AI Features Not Working

## Quick Diagnosis

Run the diagnostic script:
```bash
./check-ai-status.sh
```

This will tell you exactly what's wrong.

## Common Issues and Fixes

### Issue 1: GEMINI_API_KEY Not Set

**Symptoms:**
- Error: "Gemini API key is not configured"
- AI features return errors

**Fix:**
```bash
# Use the update script
./update-keys.sh

# Or manually on VPS
ssh root@83.229.5.230
nano /var/www/christmas-list/.env
# Add: GEMINI_API_KEY=your-key-here
pm2 restart christmas-list --update-env
```

### Issue 2: PM2 Not Loading Environment Variables

**Symptoms:**
- GEMINI_API_KEY is in .env file
- But app still says key is not configured

**Fix:**
```bash
ssh root@83.229.5.230
cd /var/www/christmas-list
pm2 restart christmas-list --update-env
```

The `--update-env` flag forces PM2 to reload environment variables.

### Issue 3: Invalid API Key

**Symptoms:**
- Key is set but API calls fail
- Error messages about authentication

**Fix:**
1. Get a new key from https://makersuite.google.com/app/apikey
2. Update it using `./update-keys.sh`
3. Restart: `pm2 restart christmas-list --update-env`

### Issue 4: Code Not Updated on VPS

**Symptoms:**
- Old error messages
- Code changes not reflected

**Fix:**
```bash
ssh root@83.229.5.230
cd /var/www/christmas-list
git pull origin main
npm install
npm run build
pm2 restart christmas-list --update-env
```

## Step-by-Step Fix

1. **Check current status:**
   ```bash
   ./check-ai-status.sh
   ```

2. **Set API key (if missing):**
   ```bash
   ./update-keys.sh
   # Select option 1 (Gemini API Key)
   # Enter your key
   # Choose to restart when prompted
   ```

3. **Verify it's working:**
   ```bash
   ./check-ai-status.sh
   ```

4. **Check logs if still not working:**
   ```bash
   ssh root@83.229.5.230 'pm2 logs christmas-list --lines 50'
   ```

## Getting a Gemini API Key

1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key
5. Use `./update-keys.sh` to add it to your VPS

## Testing

After fixing, test the AI features:
1. Go to your admin panel
2. Try "Auto-Fill" on a gift
3. Or try "Get Recommendations"

If you see specific error messages, check:
- Browser console (F12)
- PM2 logs on VPS
- The diagnostic script output

