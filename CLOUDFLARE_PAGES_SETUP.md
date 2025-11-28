# Cloudflare Pages Setup Guide

This guide will help you deploy your Christmas List app to Cloudflare Pages with KV storage.

## Prerequisites

1. A Cloudflare account (free)
2. Your code pushed to GitHub
3. A Cloudflare KV namespace (we'll create this)

## Step 1: Create KV Namespace

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** → **KV**
3. Click **Create a namespace**
4. Name it: `christmas-list-kv`
5. Click **Add**
6. **Copy the Namespace ID** (you'll need this)

## Step 2: Update wrangler.toml

1. Open `wrangler.toml` in your project
2. Replace `your-kv-namespace-id` with the actual namespace ID you copied
3. Save the file

```toml
[[kv_namespaces]]
binding = "KV"
id = "your-actual-namespace-id-here"
```

## Step 3: Deploy to Cloudflare Pages

### Option A: Via Cloudflare Dashboard (Recommended)

1. Go to **Workers & Pages** → **Pages**
2. Click **Create application** → **Pages** → **Connect to Git**
3. Connect your GitHub account
4. Select the `christmas-list` repository
5. Configure build settings:
   - **Framework preset:** None (or Other - don't use Next.js preset)
   - **Build command:** `npm run pages:build`
   - **Build output directory:** `.vercel/output/static`
   - **Deploy command:** `npx wrangler pages deploy .vercel/output/static --project-name=christmas-list`
   - **Root directory:** `/` (leave empty)
   
   **Note:** Use `npx wrangler` (not just `wrangler`) since it's not globally installed in the build environment.
   
   **CRITICAL:** 
   - Don't use "Next.js" framework preset - it conflicts with the adapter
   - Use "None" or "Other" framework preset
   - The build output MUST be `.vercel/output/static` (after adapter runs)
   
6. Click **Save and Deploy**
   
   **If you see "Hello World":**
   - Check build logs - make sure `@cloudflare/next-on-pages` completed
   - Verify `.vercel/output/static` directory exists after build
   - Make sure `_worker.js` is in the output directory
   - Try changing framework preset to "None"
   
   **If you get an internal error:**
   - Try refreshing the page
   - Check that your project name matches exactly
   - Try without the `--project-name` flag: `wrangler pages deploy .vercel/output/static`
   - Or contact Cloudflare support

### Option B: Via Wrangler CLI

```bash
# Build the project
npm run pages:build

# Deploy
wrangler pages deploy .vercel/output/static --project-name=christmas-list
```

## Step 4: Configure KV Binding in Cloudflare Dashboard

After your first deployment:

1. Go to your Pages project in Cloudflare Dashboard
2. Navigate to **Settings** → **Functions**
3. Under **KV Namespace Bindings**, click **Add binding**
4. Set:
   - **Variable name:** `KV`
   - **KV namespace:** Select `christmas-list-kv`
5. Click **Save**
6. Redeploy your project (or it will auto-redeploy)

## Step 5: Set Environment Variables

In your Pages project → **Settings** → **Environment Variables**, add:

- `ADMIN_PASSWORD` - Your admin password
- `JWT_SECRET` - A random secret string (generate with: `openssl rand -base64 32`)
- `GEMINI_API_KEY` - Your Google Gemini API key (optional)
- `NODE_ENV` = `production`

## Step 6: Verify Deployment

1. Visit your Cloudflare Pages URL
2. Test the main page loads
3. Test admin login at `/admin`
4. Test adding/editing gifts
5. Check that data persists (KV is working)

## Troubleshooting

### KV Not Working

- Verify KV namespace binding is configured in Pages Settings → Functions
- Check that the binding name matches `KV` (case-sensitive)
- Ensure you've redeployed after adding the binding

### Build Fails

- Check that `@cloudflare/next-on-pages` is installed
- Verify Node.js version (18+)
- Check build logs in Cloudflare Dashboard

### API Routes Not Working

- Verify KV binding is set up correctly
- Check Cloudflare Pages Functions logs
- Ensure all API routes are using `getKVFromRequest(request)`

## Local Development

To test locally with Cloudflare Pages:

```bash
# Build for Cloudflare Pages
npm run pages:build

# Run local dev server
npm run pages:dev
```

Note: KV bindings work differently in local dev. You may need to use `wrangler pages dev` with proper configuration.

## Cost

- **Cloudflare Pages:** FREE (unlimited requests)
- **Cloudflare KV:** FREE (100,000 reads/day, 1,000 writes/day)
- **Total:** FREE for most use cases!

## Next Steps

- Set up a custom domain
- Enable HTTPS (automatic with Cloudflare)
- Configure caching if needed

