import { NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/store';

// GET settings (public)
export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    const { getSettings } = await import('@/lib/store');
    const defaultSettings = await getSettings();
    return NextResponse.json(defaultSettings);
  }
}

// PUT update settings (should be auth protected in production)
export async function PUT(request) {
  try {
    const updates = await request.json();
    
    // Get current settings
    const currentSettings = await getSettings();
    
    // Merge updates
    const newSettings = {
      ...currentSettings,
      ...updates,
    };
    
    await saveSettings(newSettings);
    
    return NextResponse.json(newSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

