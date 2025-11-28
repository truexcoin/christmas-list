import { NextResponse } from 'next/server';
import { trackPrice } from '@/lib/store';
import { requireAuth } from '@/lib/auth';

// POST - Track price for a gift (auth required)
export async function POST(request) {
  try {
    // Check authentication
    const auth = await requireAuth(request);
    if (auth.error) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const { id, price, source } = await request.json();

    if (!id || !price) {
      return NextResponse.json(
        { error: 'Gift ID and price are required' },
        { status: 400 }
      );
    }

    const updated = await trackPrice(id, price, source || 'manual');

    if (!updated) {
      return NextResponse.json(
        { error: 'Gift not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error tracking price:', error);
    return NextResponse.json(
      { error: 'Failed to track price' },
      { status: 500 }
    );
  }
}

