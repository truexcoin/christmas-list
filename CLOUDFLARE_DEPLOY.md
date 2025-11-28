# Deploying to Cloudflare Pages

## ⚠️ Important Compatibility Note

Your app uses **Next.js 16**, but Cloudflare Pages has some limitations with Next.js API routes. The `@cloudflare/next-on-pages` adapter is deprecated and recommends OpenNext, but that's more complex.

## Recommended: Use Cloudflare Pages Directly

Cloudflare Pages now has better Next.js support. Here's how to deploy:

### Step 1: Prepare Your Repository

1. Make sure your code is pushed to GitHub/GitLab/Bitbucket

### Step 2: Deploy via Cloudflare Dashboard

1. **Go to Cloudflare Dashboard**
   - Visit https://dash.cloudflare.com
   - Sign up/login if needed

2. **Create a Pages Project**
   - Click "Workers & Pages" → "Create application" → "Pages" → "Connect to Git"
   - Connect your GitHub account
   - Select your `christmas-list` repository

3. **Configure Build Settings**
   - **Framework preset:** Next.js
   - **Build command:** `npm run build`
   - **Build output directory:** `.next`
   - **Root directory:** `/` (leave empty)
   - **⚠️ IMPORTANT:** Do NOT set a custom deploy command. Leave it empty and let Cloudflare Pages handle deployment automatically.

4. **Set Environment Variables**
   Go to Settings → Environment Variables and add:
   - `ADMIN_PASSWORD` = your admin password
   - `JWT_SECRET` = a random secret string
   - `REDIS_URL` = your Redis URL (optional, for persistent storage)
   - `GEMINI_API_KEY` = your Gemini API key (optional)
   - `NODE_ENV` = `production`

5. **Deploy**
   - Click "Save and Deploy"
   - Wait for build to complete

### Step 3: Set Up Redis (Optional but Recommended)

Since Cloudflare Pages doesn't include Redis, you'll need:

1. **Upstash Redis** (Free tier available)
   - Sign up at https://upstash.com
   - Create a Redis database
   - Copy the `REDIS_URL`
   - Add it to Cloudflare Pages environment variables

2. **Or Redis Cloud** (Free tier available)
   - Sign up at https://redis.com/try-free
   - Create a database
   - Copy the connection URL

### Step 4: Custom Domain (Optional)

1. Go to your Pages project → Custom domains
2. Add your domain
3. Follow DNS setup instructions

## Alternative: Use Cloudflare Workers for API Routes

If API routes don't work on Pages, you can:

1. Deploy static pages to Cloudflare Pages
2. Deploy API routes separately as Cloudflare Workers
3. Update API URLs in your frontend code

## Testing the Deployment

After deployment:
1. Visit your Cloudflare Pages URL
2. Test the main page loads
3. Test admin login
4. Test adding/editing gifts
5. Test API routes work

## Troubleshooting

### API Routes Not Working
- Check Cloudflare Pages Functions logs
- Some Node.js APIs may not be available
- Consider moving to Cloudflare Workers

### Build Fails
- Check build logs in Cloudflare Dashboard
- Ensure all dependencies are compatible
- Try building locally first: `npm run build`

### Redis Connection Issues
- Verify `REDIS_URL` is set correctly
- Check Redis service is running
- Test connection from Cloudflare Functions

## Cost Comparison

- **Cloudflare Pages:** FREE (unlimited requests, generous bandwidth)
- **Vercel Free Tier:** FREE (100GB bandwidth, 100 hours build time)
- **Cloudflare Workers:** FREE (100,000 requests/day)

Cloudflare Pages is essentially free for most use cases!

## Need Help?

- Cloudflare Docs: https://developers.cloudflare.com/pages
- Next.js on Cloudflare: https://developers.cloudflare.com/pages/framework-guides/nextjs

