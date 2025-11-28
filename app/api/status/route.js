import { NextResponse } from 'next/server';
import { getKVFromRequest } from '@/lib/kv';

export const runtime = 'edge';

export async function GET(request) {
  // Check if KV is available (Cloudflare Pages)
  const kv = await getKVFromRequest(request);
  
  let kvDetails = {
    available: false,
    method: 'none',
    error: null,
  };
  
  if (kv) {
    kvDetails.available = true;
    kvDetails.method = 'found';
    
    // Try to test KV access
    try {
      // Just check if it has the expected methods
      if (typeof kv.get === 'function' && typeof kv.put === 'function') {
        kvDetails.method = 'working';
      }
    } catch (e) {
      kvDetails.error = e.message;
    }
  } else {
    // Try different methods to diagnose
    try {
      const adapter = await import('@cloudflare/next-on-pages');
      if (adapter && adapter.getRequestContext) {
        const ctx = adapter.getRequestContext();
        if (ctx) {
          kvDetails.method = 'context-exists';
          kvDetails.envKeys = ctx.env ? Object.keys(ctx.env) : [];
        }
      }
    } catch (e) {
      kvDetails.error = e.message;
    }
  }
  
  return NextResponse.json({
    storage: 'Cloudflare KV',
    kv: kvDetails,
    environment: process.env.NODE_ENV || 'production',
  });
}

