import { NextResponse } from 'next/server';
import { getGift, updateGift, deleteGift } from '@/lib/store';
import { requireAuth } from '@/lib/auth';
import { getKVFromRequest } from '@/lib/kv';

// GET single gift (public)
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const kv = await getKVFromRequest(request);
    const gift = await getGift(id, kv);

    if (!gift) {
      return NextResponse.json(
        { error: 'Gift not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(gift);
  } catch (error) {
    console.error('Error fetching gift:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gift' },
      { status: 500 }
    );
  }
}

// PUT update gift (auth required)
export async function PUT(request, { params }) {
  try {
    // Check authentication
    const auth = await requireAuth(request);
    if (auth.error) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const { id } = await params;
    const updates = await request.json();

    // Parse stores if it's a string
    if (typeof updates.stores === 'string') {
      try {
        updates.stores = JSON.parse(updates.stores);
      } catch {
        updates.stores = [];
      }
    }

    const kv = await getKVFromRequest(request);
    const updated = await updateGift(id, updates, kv);

    if (!updated) {
      return NextResponse.json(
        { error: 'Gift not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating gift:', error);
    return NextResponse.json(
      { error: 'Failed to update gift' },
      { status: 500 }
    );
  }
}

// PATCH - Track price (auth required)
export async function PATCH(request, { params }) {
  try {
    // Check authentication
    const auth = await requireAuth(request);
    if (auth.error) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const { id } = await params;
    const { price, source } = await request.json();

    if (!price) {
      return NextResponse.json(
        { error: 'Price is required' },
        { status: 400 }
      );
    }

    const kv = await getKVFromRequest(request);
    const { trackPrice } = await import('@/lib/store');
    const updated = await trackPrice(id, price, source || 'manual', kv);

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

// DELETE gift (auth required)
export async function DELETE(request, { params }) {
  try {
    // Check authentication
    const auth = await requireAuth(request);
    if (auth.error) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const { id } = await params;
    const kv = await getKVFromRequest(request);
    const deleted = await deleteGift(id, kv);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Gift not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting gift:', error);
    return NextResponse.json(
      { error: 'Failed to delete gift' },
      { status: 500 }
    );
  }
}

