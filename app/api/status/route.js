import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const redisUrl = process.env.REDIS_URL;
  
  return NextResponse.json({
    redisConnected: !!redisUrl,
    redisUrl: redisUrl ? 'Set ✓' : 'Not set ✗',
    environment: process.env.NODE_ENV,
  });
}

