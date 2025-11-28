import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  // Check if KV is available (Cloudflare Pages)
  const kvAvailable = typeof process !== 'undefined' && process.env && process.env.KV;
  
  return NextResponse.json({
    storage: 'Cloudflare KV',
    kvAvailable: !!kvAvailable,
    environment: process.env.NODE_ENV || 'production',
  });
}

