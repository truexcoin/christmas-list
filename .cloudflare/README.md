# Cloudflare Pages Deployment Guide

## Prerequisites

1. Create a Cloudflare account at https://dash.cloudflare.com
2. Install Wrangler CLI: `npm install -g wrangler`
3. Login: `wrangler login`

## Deployment Steps

### Option 1: Deploy via Cloudflare Dashboard (Recommended)

1. Push your code to GitHub
2. Go to Cloudflare Dashboard → Pages → Create a project
3. Connect your GitHub repository
4. Build settings:
   - **Framework preset:** Next.js
   - **Build command:** `npm run pages:build`
   - **Build output directory:** `.vercel/output/static`
   - **Root directory:** `/` (or leave empty)

5. Environment variables (add in Cloudflare Dashboard):
   - `ADMIN_PASSWORD` - Your admin password
   - `JWT_SECRET` - A random secret string
   - `REDIS_URL` - Your Redis connection URL (optional)
   - `GEMINI_API_KEY` - Your Google Gemini API key (optional)

6. Click "Save and Deploy"

### Option 2: Deploy via Wrangler CLI

```bash
# Build the project
npm run pages:build

# Deploy
wrangler pages deploy .vercel/output/static --project-name=christmas-list
```

## Important Notes

- **Redis Storage:** You'll need to set up Redis separately (Upstash, Redis Cloud, etc.) and add the `REDIS_URL` environment variable
- **API Routes:** Cloudflare Pages Functions have some limitations. All API routes should work, but test thoroughly.
- **File Size Limits:** Cloudflare Pages has limits on function size and execution time

## Environment Variables

Set these in Cloudflare Dashboard → Pages → Your Project → Settings → Environment Variables:

- `ADMIN_PASSWORD` (required)
- `JWT_SECRET` (required)
- `REDIS_URL` (optional - for persistent storage)
- `GEMINI_API_KEY` (optional - for AI features)
- `NODE_ENV=production`

## Troubleshooting

If API routes don't work:
1. Check Cloudflare Pages Functions logs
2. Ensure all dependencies are compatible with Cloudflare Workers runtime
3. Some Node.js APIs may not be available - check Cloudflare Workers documentation

