import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireAuth } from '@/lib/auth';
import { searchProductImage, searchProductImagePexels, searchProductImageUnsplash } from '@/lib/imageSearch';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

// Initialize only if API key is provided
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// POST - Get AI recommendations based on existing gifts
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

    const { gifts } = await request.json();

    if (!gifts || !Array.isArray(gifts) || gifts.length === 0) {
      return NextResponse.json(
        { error: 'Gift list is required and must not be empty' },
        { status: 400 }
      );
    }

    // Prepare gift summary for AI
    const giftSummary = gifts.map(gift => ({
      name: gift.name,
      price: gift.price,
      priority: gift.priority || 'medium',
      description: gift.description || '',
    }));

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

    const prompt = `You are a helpful gift recommendation assistant. Analyze the following Christmas wishlist and suggest 8-10 additional gift ideas that would complement the existing items.

Existing Gifts:
${JSON.stringify(giftSummary, null, 2)}

Analyze the patterns in this wishlist:
1. What categories/types of gifts are present?
2. What price ranges are common?
3. What priority levels are used?
4. What themes or interests are evident?
5. What categories might be missing?

Based on this analysis, suggest 8-10 new gift recommendations that:
- Complement the existing gifts
- Fill in missing categories
- Match the price range patterns
- Are diverse and interesting
- Would make great Christmas gifts

For each recommendation, provide:
- A specific product name (be specific, not generic)
- A compelling 2-3 sentence description
- An estimated price in USD format (e.g., "$99.99")
- A brief reason why this gift fits the wishlist (1 sentence)
- A suggested priority (high, medium, or low)

Format your response as JSON only:
{
  "recommendations": [
    {
      "name": "Specific Product Name",
      "description": "2-3 sentence description of why this is a great gift",
      "price": "$XX.XX",
      "reason": "Why this gift fits the wishlist",
      "priority": "high|medium|low",
      "imageSearchTerm": "product type keywords for image search"
    }
  ]
}

Only respond with valid JSON, no markdown or additional text.`;

    console.log(`[AI Recommendations] Generating recommendations for ${gifts.length} gifts...`);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    if (!response) {
      throw new Error('No response from Gemini API');
    }
    
    const text = response.text();
    
    if (!text || text.trim().length === 0) {
      throw new Error('Empty response from Gemini API');
    }
    
    console.log(`[AI Recommendations] Received response (${text.length} chars)`);

    // Try to parse the JSON response
    let parsedResponse;
    try {
      // Remove any markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('[AI Recommendations] JSON parse error:', parseError);
      console.error('[AI Recommendations] Raw response text:', text);
      return NextResponse.json(
        { error: `Failed to parse AI response: ${parseError.message}. Please try again.` },
        { status: 500 }
      );
    }

    // Validate response structure
    if (!parsedResponse.recommendations || !Array.isArray(parsedResponse.recommendations)) {
      return NextResponse.json(
        { error: 'Invalid response format from AI' },
        { status: 500 }
      );
    }

    // Search for images for each recommendation
    console.log(`[Image Search] Fetching images for ${parsedResponse.recommendations.length} recommendations...`);
    
    const recommendationsWithImages = await Promise.all(
      parsedResponse.recommendations.map(async (rec, index) => {
        let imageUrl = '';
        const searchTerm = rec.imageSearchTerm || rec.name;
        
        if (searchTerm) {
          // Try Unsplash API first (if key provided), then Pexels, then fallback
          if (UNSPLASH_ACCESS_KEY) {
            imageUrl = await searchProductImageUnsplash(searchTerm, UNSPLASH_ACCESS_KEY);
          }
          
          if (!imageUrl && PEXELS_API_KEY) {
            imageUrl = await searchProductImagePexels(searchTerm, PEXELS_API_KEY);
          }
          
          // Fallback to Unsplash source API (no key needed)
          if (!imageUrl) {
            imageUrl = await searchProductImage(searchTerm);
          }
          
          if (imageUrl) {
            console.log(`[Image Search] ✅ Recommendation ${index + 1}: Found image for "${rec.name}"`);
          } else {
            console.log(`[Image Search] ⚠️ Recommendation ${index + 1}: No image for "${rec.name}"`);
          }
        }

        return {
          ...rec,
          image: imageUrl || '',
          imageSearchTerm: undefined, // Remove from response
        };
      })
    );
    
    console.log(`[Image Search] Completed image search for all recommendations`);

    return NextResponse.json({
      recommendations: recommendationsWithImages,
    });
  } catch (error) {
    console.error('[AI Recommendations] Error:', error);
    console.error('[AI Recommendations] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to generate recommendations. Please try again.';
    
    if (error.message?.includes('API_KEY')) {
      errorMessage = 'Invalid or missing Gemini API key. Please check your GEMINI_API_KEY environment variable.';
    } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      errorMessage = 'API rate limit exceeded. Please try again in a few moments.';
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorMessage = 'Network error. Please check your internet connection and try again.';
    } else if (error.message) {
      errorMessage = `Error: ${error.message}`;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

