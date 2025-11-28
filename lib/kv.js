// Helper to get Cloudflare KV from runtime context
// Works with @cloudflare/next-on-pages

export async function getKVFromRequest(request) {
  // In Cloudflare Pages with @cloudflare/next-on-pages,
  // KV bindings are available via getRequestContext
  try {
    // Dynamic import to avoid build-time issues
    const adapter = await import('@cloudflare/next-on-pages');
    if (adapter && adapter.getRequestContext) {
      const ctx = adapter.getRequestContext();
      if (ctx && ctx.env && ctx.env.KV) {
        return ctx.env.KV;
      }
    }
  } catch (e) {
    // Not available or not in Cloudflare runtime - this is OK
    // The adapter is only available at runtime, not build time
  }
  
  return null;
}
