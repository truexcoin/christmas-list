import { NextResponse } from 'next/server';

export async function GET() {
  // Check what storage is available
  let storageType = 'none';
  let storageAvailable = false;
  
  // Check Vercel KV
  try {
    const kvModule = await import('@vercel/kv');
    if (kvModule && kvModule.kv) {
      storageType = 'vercel-kv';
      storageAvailable = true;
    }
  } catch (e) {
    // Vercel KV not available
  }
  
  // Check Redis
  if (!storageAvailable && process.env.REDIS_URL) {
    storageType = 'redis';
    storageAvailable = true;
  }
  
  return NextResponse.json({
    storage: storageType,
    storageAvailable: storageAvailable,
    redisUrl: process.env.REDIS_URL ? 'Set ✓' : 'Not set ✗',
    environment: process.env.NODE_ENV || 'production',
  });
}

