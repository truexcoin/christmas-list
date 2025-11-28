import { NextResponse } from 'next/server';

export async function GET() {
  // Check if Vercel KV is available
  let kvAvailable = false;
  try {
    const kvModule = await import('@vercel/kv');
    if (kvModule && kvModule.kv) {
      kvAvailable = true;
    }
  } catch (e) {
    // KV not available
  }
  
  return NextResponse.json({
    storage: 'Vercel KV',
    kvAvailable: kvAvailable,
    environment: process.env.NODE_ENV || 'production',
  });
}

