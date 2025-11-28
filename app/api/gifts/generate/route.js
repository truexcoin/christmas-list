import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchProductImage, searchProductImagePexels, searchProductImageUnsplash } from '@/lib/imageSearch';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

// Initialize only if API key is provided
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export async function POST(request) {
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    // Check if API key is set
    if (!GEMINI_API_KEY || !genAI) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured. Please set GEMINI_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    // Use gemini-pro (most stable and widely available)
    // Note: gemini-1.5-flash may not be available in all API versions
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a helpful shopping assistant. I want to add "${name}" to my Christmas wishlist. Please provide complete product information.

Generate the following information for this product:
1. The exact/official product name (if it's a general item, pick a popular specific version)
2. A compelling description (2-3 sentences explaining what it is and why it makes a great gift)
3. The typical retail price (use USD format like "$99" or "$149.99")
4. A simple image search term (1-3 words describing the product type, e.g., "wireless headphones", "gaming console", "smart watch")
5. Priority suggestion (high, medium, or low based on typical gift appeal)
6. 2-4 stores where this can be purchased with their actual product page URLs

Format your response as JSON only:
{
  "name": "Official Product Name",
  "description": "Product description...",
  "price": "$XX.XX",
  "imageSearchTerm": "product type keywords",
  "priority": "high|medium|low",
  "stores": [
    { "name": "Store Name", "url": "https://store-url.com/product" }
  ]
}

Only respond with valid JSON, no markdown or additional text.`;

    console.log(`[AI Generate] Generating content for: "${name}"`);
    
    let result, response, text;
    try {
      result = await model.generateContent(prompt);
      response = await result.response;
      
      if (!response) {
        throw new Error('No response from Gemini API');
      }
      
      text = response.text();
      
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Gemini API');
      }
      
      console.log(`[AI Generate] Received response (${text.length} chars)`);
    } catch (apiError) {
      console.error('[AI Generate] Gemini API call failed:', apiError);
      
      // Extract more specific error information
      let errorMsg = apiError.message || 'Unknown error';
      
      // Check for common Gemini API errors
      if (apiError.statusCode) {
        errorMsg = `API Error ${apiError.statusCode}: ${errorMsg}`;
      }
      
      if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('401')) {
        throw new Error('Invalid Gemini API key. Please check your GEMINI_API_KEY environment variable.');
      }
      
      if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('rate limit')) {
        throw new Error('API rate limit exceeded. Please try again in a few moments.');
      }
      
      if (errorMsg.includes('400') || errorMsg.includes('Bad Request')) {
        throw new Error(`Invalid request to Gemini API: ${errorMsg}`);
      }
      
      // Re-throw with more context
      throw new Error(`Gemini API error: ${errorMsg}`);
    }

    // Try to parse the JSON response
    let parsedResponse;
    try {
      // Remove any markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('[AI Generate] JSON parse error:', parseError);
      console.error('[AI Generate] Raw response text:', text);
      return NextResponse.json(
        { error: `Failed to parse AI response: ${parseError.message}. Please try again.` },
        { status: 500 }
      );
    }

    // Validate required fields
    if (!parsedResponse.name || !parsedResponse.price) {
      return NextResponse.json(
        { error: 'AI response missing required fields. Please try again.' },
        { status: 500 }
      );
    }

    // Search for product image
    let imageUrl = '';
    const searchTerm = parsedResponse.imageSearchTerm || parsedResponse.name;
    
    if (searchTerm) {
      console.log(`[Image Search] Searching for: "${searchTerm}"`);
      
      // Try Unsplash API first (if key provided), then Pexels, then fallback
      if (UNSPLASH_ACCESS_KEY) {
        console.log('[Image Search] Trying Unsplash API...');
        imageUrl = await searchProductImageUnsplash(searchTerm, UNSPLASH_ACCESS_KEY);
        if (imageUrl) {
          console.log('[Image Search] ✅ Found image via Unsplash');
        }
      }
      
      if (!imageUrl && PEXELS_API_KEY) {
        console.log('[Image Search] Trying Pexels API...');
        imageUrl = await searchProductImagePexels(searchTerm, PEXELS_API_KEY);
        if (imageUrl) {
          console.log('[Image Search] ✅ Found image via Pexels');
        }
      }
      
      // Fallback to Unsplash source API (no key needed, but less reliable)
      if (!imageUrl) {
        console.log('[Image Search] Using fallback image service...');
        imageUrl = await searchProductImage(searchTerm);
        if (imageUrl) {
          console.log('[Image Search] ✅ Using fallback image');
        }
      }
      
      if (!imageUrl) {
        console.log('[Image Search] ⚠️ No image found for search term');
      }
    } else {
      console.log('[Image Search] ⚠️ No search term provided');
    }

    // Return with image if found
    return NextResponse.json({
      ...parsedResponse,
      image: imageUrl || '', // Include image URL if found
      imageSearchTerm: undefined, // Remove from response
    });
  } catch (error) {
    console.error('[AI Generate] Error:', error);
    console.error('[AI Generate] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
    });
    
    // The error message should already be specific from our error handling above
    // But provide a fallback if it's not
    let errorMessage = error.message || 'Failed to generate gift details. Please try again.';
    
    // Ensure we're not exposing internal details in production
    if (process.env.NODE_ENV === 'production' && errorMessage.includes('stack')) {
      errorMessage = 'Failed to generate gift details. Please check your API key and try again.';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

