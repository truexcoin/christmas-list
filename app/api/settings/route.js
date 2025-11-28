import { NextResponse } from 'next/server';
import { createClient } from 'redis';

const SETTINGS_KEY = 'christmas-list-settings';

const defaultSettings = {
  emoji: '🎄',
  title: 'Christmas Wishlist',
  subtitle: 'Click on any gift to see more details and where to buy',
};

let redis = null;

async function getRedis() {
  if (!redis && process.env.REDIS_URL) {
    redis = await createClient({ url: process.env.REDIS_URL }).connect();
  }
  return redis;
}

// GET settings (public)
export async function GET() {
  try {
    const client = await getRedis();
    
    if (client) {
      const data = await client.get(SETTINGS_KEY);
      if (data) {
        return NextResponse.json(JSON.parse(data));
      }
    }
    
    return NextResponse.json(defaultSettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(defaultSettings);
  }
}

// PUT update settings (should be auth protected in production)
export async function PUT(request) {
  try {
    const client = await getRedis();
    
    if (!client) {
      return NextResponse.json(
        { error: 'Database not connected' },
        { status: 500 }
      );
    }
    
    const updates = await request.json();
    
    // Get current settings
    const currentData = await client.get(SETTINGS_KEY);
    const currentSettings = currentData ? JSON.parse(currentData) : defaultSettings;
    
    // Merge updates
    const newSettings = {
      ...currentSettings,
      ...updates,
    };
    
    await client.set(SETTINGS_KEY, JSON.stringify(newSettings));
    
    return NextResponse.json(newSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

