// Helper to get Cloudflare KV from runtime context
// Works with @cloudflare/next-on-pages

export async function getKVFromRequest(request) {
  // In Cloudflare Pages with @cloudflare/next-on-pages,
  // KV bindings are available via getRequestContext
  try {
    // Dynamic import to avoid issues if not in Cloudflare runtime
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    if (getRequestContext) {
      const ctx = getRequestContext();
      if (ctx && ctx.env && ctx.env.KV) {
        return ctx.env.KV;
      }
    }
  } catch (e) {
    // Not available or not in Cloudflare runtime - this is OK
  }
  
  // Fallback: try to get from process.env (set by adapter during build)
  // This won't work at runtime but helps with type checking
  if (typeof process !== 'undefined' && process.env) {
    // The adapter may set this, but runtime access is via getRequestContext
    // This is just a fallback for development
  }
  
  return null;
}

// Synchronous version for cases where we can't use async
export function getKV() {
  try {
    const { getRequestContext } = require('@cloudflare/next-on-pages');
    const ctx = getRequestContext();
    if (ctx && ctx.env && ctx.env.KV) {
      return ctx.env.KV;
    }
  } catch (e) {
    // Not in Cloudflare runtime
  }
  return null;
}
