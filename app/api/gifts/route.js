import { NextResponse } from 'next/server';
import { getGifts, addGift } from '@/lib/store';
import { requireAuth } from '@/lib/auth';

// GET all gifts (public)
export async function GET() {
  try {
    const gifts = await getGifts();
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

    console.log('[Gifts API] Creating gift:', { 
      name: giftData.name, 
      hasPrice: !!giftData.price,
      hasImage: !!giftData.image,
      storesCount: giftData.stores?.length || 0
    });

    const newGift = await addGift({
      name: giftData.name,
      price: giftData.price,
      image: giftData.image || '',
      description: giftData.description || '',
      priority: giftData.priority || 'medium',
      stores: giftData.stores || [],
    });

    console.log('[Gifts API] Gift created successfully:', newGift.id);
    return NextResponse.json(newGift, { status: 201 });
  } catch (error) {
    console.error('[Gifts API] Error creating gift:', error);
    console.error('[Gifts API] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create gift. Please try again.';
    
    if (error.message?.includes('Redis not connected') || error.message?.includes('REDIS_URL')) {
      errorMessage = 'Database connection error. Please check your Redis configuration.';
    } else if (error.message?.includes('Failed to save')) {
      errorMessage = `Database error: ${error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

