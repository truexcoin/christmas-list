import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'edge';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDTnLjjBnpc8nIJFT5Vmr_uL4o9_KfW1XQ';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { name, description, price } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

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
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deals. Please try again.' },
      { status: 500 }
    );
  }
}

