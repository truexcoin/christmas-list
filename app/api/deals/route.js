import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize only if API key is provided
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export async function POST(request) {
  try {
    const { name, description, price } = await request.json();

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

    const prompt = `You are a helpful shopping assistant. Find the best deals and prices for the following product:

Product: ${name}
${description ? `Description: ${description}` : ''}
${price ? `Listed Price: ${price}` : ''}

Please provide:
1. A brief summary of where to find the best deals for this item (2-3 sentences)
2. A list of 3-5 retailers with DIRECT LINKS to the product page (not homepage)
3. Any current deals, sales, or discount tips
4. Alternative similar products that might be cheaper

IMPORTANT: For retailer URLs, provide the ACTUAL product page URL, not the store homepage.
- For Amazon: use https://www.amazon.com/s?k={product+name+encoded}
- For Best Buy: use https://www.bestbuy.com/site/searchpage.jsp?st={product+name+encoded}
- For Walmart: use https://www.walmart.com/search?q={product+name+encoded}
- For Target: use https://www.target.com/s?searchTerm={product+name+encoded}
- For other stores: use their search URL with the product name

Format your response as JSON with this structure:
{
  "summary": "Brief summary of best deals...",
  "retailers": [
    { "name": "Store Name", "priceRange": "$XX - $XX", "url": "https://actual-product-search-url", "note": "Optional note about deals" }
  ],
  "deals": [
    { "title": "Deal title", "description": "Deal description" }
  ],
  "alternatives": [
    { "name": "Product name", "price": "$XX", "reason": "Why it's a good alternative" }
  ]
}

Only respond with valid JSON, no markdown or additional text.`;

    console.log(`[AI Deals] Searching for deals: "${name}"`);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    if (!response) {
      throw new Error('No response from Gemini API');
    }
    
    const text = response.text();
    
    if (!text || text.trim().length === 0) {
      throw new Error('Empty response from Gemini API');
    }
    
    console.log(`[AI Deals] Received response (${text.length} chars)`);

    // Try to parse the JSON response
    let parsedResponse;
    try {
      // Remove any markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(cleanText);
    } catch (parseError) {
      // If JSON parsing fails, create a structured response from the text
      parsedResponse = {
        summary: text,
        retailers: [],
        deals: [],
        alternatives: [],
        raw: true,
      };
    }

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error('[AI Deals] Error:', error);
    console.error('[AI Deals] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to fetch deals. Please try again.';
    
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

