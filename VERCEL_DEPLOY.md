# Deploying to Vercel

This guide will help you deploy your Christmas List app to Vercel.

## Prerequisites

1. A Vercel account (free) - [vercel.com](https://vercel.com)
2. Your code pushed to GitHub
3. A Vercel KV database (we'll create this)

## Step 1: Deploy to Vercel

1. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Sign up/login (use GitHub for easiest setup)

2. **Import Your Project**
   - Click "Add New Project"
   - Import your GitHub repository: `christmas-list`
   - Vercel will auto-detect Next.js settings

3. **Configure Build Settings**
   - Framework: Next.js (auto-detected)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)
   - Root Directory: `/` (default)

4. **Add Environment Variables**
   - Click "Environment Variables"
   - Add:
     - `ADMIN_PASSWORD` = your admin password
     - `JWT_SECRET` = a random secret string (generate with: `openssl rand -base64 32`)
     - `GEMINI_API_KEY` = your Gemini API key (optional)

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your app will be live at `your-project.vercel.app`

## Step 2: Set Up Vercel KV (Required for Data Persistence)

1. **Create KV Database**
   - Go to your Vercel project dashboard
   - Click "Storage" tab
   - Click "Create Database"
   - Select "KV"
   - Name it: `christmas-list-kv`
   - Click "Create"

2. **Link to Project**
   - The KV database will automatically be linked to your project
   - No additional configuration needed!
   - Vercel automatically configures `@vercel/kv` package

3. **Verify**
   - Visit your app: `https://your-project.vercel.app/api/status`
   - Should show: `"kvAvailable": true`

## Step 3: Add Custom Domain (Optional)

1. **Add Domain**
   - Go to your project → Settings → Domains
   - Click "Add Domain"
   - Enter your domain name
   - Follow DNS setup instructions

2. **Configure DNS**
   - Add the CNAME record Vercel provides
   - Wait for DNS propagation (5-60 minutes)
   - SSL certificate is automatically provisioned

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `ADMIN_PASSWORD` | Admin panel password | ✅ Yes |
| `JWT_SECRET` | Secret for JWT tokens | ✅ Yes |
| `GEMINI_API_KEY` | Google Gemini API key | ❌ Optional |

**Note:** Vercel KV is automatically configured - no environment variables needed!

## Testing Your Deployment

1. **Visit your app**
   - Go to `https://your-project.vercel.app`
   - Should see the Christmas wishlist

2. **Test admin panel**
   - Go to `/admin`
   - Login with your `ADMIN_PASSWORD`
   - Add/edit gifts

3. **Test API**
   - Visit `/api/status` - should show KV available
   - Visit `/api/gifts` - should return gifts array

## Troubleshooting

### KV Not Working
- Make sure Vercel KV database is created and linked
- Check project → Storage tab
- Verify `/api/status` shows `kvAvailable: true`

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Try building locally: `npm run build`

### Environment Variables Not Working
- Make sure variables are set for "Production" environment
- Redeploy after adding variables
- Check variable names are exact (case-sensitive)

## Cost

- **Vercel:** FREE (100GB bandwidth/month, 100 hours build time/month)
- **Vercel KV:** FREE (included with Vercel)
- **Custom Domain:** FREE (unlimited domains)
- **Total:** FREE for most use cases!

## Next Steps

- Set up a custom domain
- Configure analytics (optional)
- Set up preview deployments for branches
- Enable automatic deployments from GitHub

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support

