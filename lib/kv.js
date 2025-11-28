// Helper to get Cloudflare KV from runtime context
// Works with @cloudflare/next-on-pages

export async function getKVFromRequest(request) {
  // Method 1: Try getRequestContext (standard way)
  try {
    const adapter = await import('@cloudflare/next-on-pages');
    if (adapter && adapter.getRequestContext) {
      const ctx = adapter.getRequestContext();
      if (ctx && ctx.env && ctx.env.KV) {
        return ctx.env.KV;
      }
    }
  } catch (e) {
    // Continue to other methods
  }
  
  // Method 2: Try accessing via process.env (some configurations)
  try {
    if (typeof process !== 'undefined' && process.env) {
      // In some setups, KV might be directly available
      if (process.env.KV && typeof process.env.KV.get === 'function') {
        return process.env.KV;
      }
    }
  } catch (e) {
    // Continue
  }
  
  // Method 3: Try globalThis (edge runtime)
  try {
    if (typeof globalThis !== 'undefined' && globalThis.KV) {
      return globalThis.KV;
    }
  } catch (e) {
    // Continue
  }
  
  // Method 4: Try request.cf (Cloudflare-specific)
  try {
    if (request && request.cf && request.cf.env && request.cf.env.KV) {
      return request.cf.env.KV;
    }
  } catch (e) {
    // Continue
  }
  
  return null;
}
