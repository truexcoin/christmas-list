# Cloudflare Pages KV Binding - Complete Guide

## Where to Find KV Binding Settings

### Step 1: Navigate to Your Project
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **Workers & Pages** (left sidebar)
3. Click on your **christmas-list** project name

### Step 2: Go to Settings
1. Click the **Settings** tab (top navigation)
2. Click **Functions** in the left sidebar under Settings

### Step 3: Find KV Namespace Bindings
1. Scroll down to find **KV Namespace Bindings** section
2. It should be below "Environment Variables" and above "Durable Object Bindings"
3. If you don't see it, make sure you're in **Pages** (not Workers)

## How to Add KV Binding

1. In the **KV Namespace Bindings** section, click **Add binding**
2. A form will appear with two fields:

### Field 1: Variable name
- **Enter exactly:** `KV`
- Must be uppercase
- This is what your code expects

### Field 2: KV namespace
- Click the dropdown
- Select your namespace (the one with ID `d185102d68fb4a28b1e1ad810d24daed`)
- If you don't see it, you need to create it first (see below)

3. Click **Save**

## If You Don't Have a KV Namespace Yet

1. Go to **Workers & Pages** → **KV** (in left sidebar)
2. Click **Create a namespace**
3. Name it: `christmas-list-kv`
4. Click **Add**
5. Copy the **Namespace ID** (looks like: `d185102d68fb4a28b1e1ad810d24daed`)
6. Go back to your Pages project → Settings → Functions
7. Add the binding as described above

## Verify KV is Working

After setting up the binding and redeploying:

1. Visit your app: `https://your-app.pages.dev/api/status`
2. Check the response - it should show:
   ```json
   {
     "storage": "Cloudflare KV",
     "kv": {
       "available": true,
       "method": "working"
     }
   }
   ```

## Troubleshooting

### Can't Find KV Namespace Bindings Section
- Make sure you're in **Pages** project, not Workers
- Make sure you're in **Settings** → **Functions**
- Try refreshing the page
- Check if you have the right permissions

### Binding Not Working After Setup
1. **Redeploy your project** (Settings → Deployments → Retry deployment)
2. Wait for deployment to complete
3. Test with `/api/status` endpoint
4. Check Cloudflare Pages Functions logs for errors

### KV Returns null
- Verify binding name is exactly `KV` (case-sensitive)
- Check that namespace is selected correctly
- Make sure you've redeployed after adding binding
- Check Functions logs in Cloudflare Dashboard

## Alternative: Check via Cloudflare Dashboard

1. Go to your Pages project
2. Click **Functions** tab (not Settings → Functions)
3. You should see your API routes listed
4. Click on one (e.g., `/api/gifts`)
5. Check if KV binding is listed in the function details

## Still Having Issues?

1. **Check the build logs** - Look for any KV-related errors
2. **Check Functions logs** - Go to your project → Logs tab
3. **Test the status endpoint** - Visit `/api/status` to see KV availability
4. **Verify environment variables** - Make sure `ADMIN_PASSWORD` and `JWT_SECRET` are set

## Quick Checklist

- [ ] KV namespace created in Workers & Pages → KV
- [ ] Namespace ID copied
- [ ] In Pages project → Settings → Functions
- [ ] KV Namespace Bindings section visible
- [ ] Binding added with variable name: `KV`
- [ ] Namespace selected from dropdown
- [ ] Binding saved
- [ ] Project redeployed
- [ ] `/api/status` shows KV available

