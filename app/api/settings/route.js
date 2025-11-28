import { NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/store';
import { getKVFromRequest } from '@/lib/kv';

// GET settings (public)
export async function GET(request) {
  try {
    const kv = await getKVFromRequest(request);
    const settings = await getSettings(kv);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    const { getSettings } = await import('@/lib/store');
    const defaultSettings = await getSettings(null);
    return NextResponse.json(defaultSettings);
  }
}

// PUT update settings (should be auth protected in production)
export async function PUT(request) {
  try {
    const kv = await getKVFromRequest(request);
    
    if (!kv) {
      return NextResponse.json(
        { error: 'KV not available. Make sure KV binding is configured.' },
        { status: 500 }
      );
    }
    
    const updates = await request.json();
    
    // Get current settings
    const currentSettings = await getSettings(kv);
    
    // Merge updates
    const newSettings = {
      ...currentSettings,
      ...updates,
    };
    
    await saveSettings(newSettings, kv);
    
    return NextResponse.json(newSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

