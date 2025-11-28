# Deploying to Cloudflare Pages

## Important Note

Your app uses Next.js 16, but the Cloudflare adapter (`@cloudflare/next-on-pages`) currently supports up to Next.js 15.5.2. The installation was done with `--legacy-peer-deps` which may cause compatibility issues.

## Recommended Approach

For Next.js 16, consider these alternatives:

### Option 1: Use Cloudflare Pages with Static Export (Limited)
- Some API routes may not work
- Best for static sites

### Option 2: Use Cloudflare Workers for API Routes
- Deploy API routes separately as Cloudflare Workers
- More complex but fully supported

### Option 3: Wait for Adapter Update
- The adapter may add Next.js 16 support soon
- Check: https://github.com/cloudflare/next-on-pages

## Current Setup

If you proceed with the current setup:

1. **Build Command:** `npm run pages:build`
2. **Output Directory:** `.vercel/output/static`
3. **Node Version:** 18.x or 20.x

## Environment Variables

Set in Cloudflare Dashboard:
- `ADMIN_PASSWORD`
- `JWT_SECRET`
- `REDIS_URL` (optional)
- `GEMINI_API_KEY` (optional)
- `NODE_ENV=production`

## Testing Locally

```bash
npm run pages:build
npm run pages:dev
```

## Deployment

1. Push to GitHub
2. Connect to Cloudflare Pages
3. Use build command: `npm run pages:build`
4. Output directory: `.vercel/output/static`

