import { NextResponse } from 'next/server';
import { getGifts, addGift } from '@/lib/store';
import { requireAuth } from '@/lib/auth';
import { getKVFromRequest } from '@/lib/kv';

export const runtime = 'edge';

// GET all gifts (public)
export async function GET(request) {
  try {
    const kv = await getKVFromRequest(request);
    const gifts = await getGifts(kv);
    return NextResponse.json(gifts);
  } catch (error) {
    console.error('Error fetching gifts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gifts' },
      { status: 500 }
    );
  }
}

// POST new gift (auth required)
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

    const giftData = await request.json();

    // Validate required fields
    if (!giftData.name || !giftData.price) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      );
    }

    // Parse stores if it's a string
    if (typeof giftData.stores === 'string') {
      try {
        giftData.stores = JSON.parse(giftData.stores);
      } catch {
        giftData.stores = [];
      }
    }

    const kv = await getKVFromRequest(request);
    const newGift = await addGift({
      name: giftData.name,
      price: giftData.price,
      image: giftData.image || '',
      description: giftData.description || '',
      priority: giftData.priority || 'medium',
      stores: giftData.stores || [],
    }, kv);

    return NextResponse.json(newGift, { status: 201 });
  } catch (error) {
    console.error('Error creating gift:', error);
    return NextResponse.json(
      { error: 'Failed to create gift' },
      { status: 500 }
    );
  }
}

