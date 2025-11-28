import { NextResponse } from 'next/server';
import { getGifts, getSettings } from '@/lib/store';

// GET endpoint to export all gifts and settings as JSON
export async function GET() {
  try {
    const gifts = await getGifts();
    const settings = await getSettings();
    
    const exportData = {
      gifts: gifts || [],
      settings: settings || {},
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    return NextResponse.json(exportData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="christmas-list-export.json"'
      }
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data', details: error.message },
      { status: 500 }
    );
  }
}

