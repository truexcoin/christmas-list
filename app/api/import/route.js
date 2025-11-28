import { NextResponse } from 'next/server';
import { saveGifts, saveSettings, getGifts } from '@/lib/store';

// POST endpoint to import data from JSON
export async function POST(request) {
  try {
    const body = await request.json();
    const { gifts, settings, clearExisting } = body;
    
    // Validate data structure
    if (!gifts || !Array.isArray(gifts)) {
      return NextResponse.json(
        { error: 'Invalid data format: gifts must be an array' },
        { status: 400 }
      );
    }
    
    // Validate each gift has required fields
    for (const gift of gifts) {
      if (!gift.name) {
        return NextResponse.json(
          { error: 'Invalid gift data: all gifts must have a name' },
          { status: 400 }
        );
      }
    }
    
    // Clear existing data if requested
    let giftsToImport = gifts;
    if (clearExisting) {
      await saveGifts([]);
    } else {
      // Merge with existing gifts (avoid duplicates by ID)
      const existingGifts = await getGifts();
      const existingIds = new Set(existingGifts.map(g => g.id));
      const newGifts = gifts.filter(g => !existingIds.has(g.id));
      giftsToImport = [...existingGifts, ...newGifts];
    }
    
    // Import gifts
    await saveGifts(giftsToImport);
    
    // Import settings if provided
    if (settings && typeof settings === 'object') {
      await saveSettings(settings);
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully imported ${giftsToImport.length} gift(s)`,
      imported: {
        gifts: giftsToImport.length,
        settings: settings ? true : false
      }
    });
  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json(
      { error: 'Failed to import data', details: error.message },
      { status: 500 }
    );
  }
}

