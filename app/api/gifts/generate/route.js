import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDTnLjjBnpc8nIJFT5Vmr_uL4o9_KfW1XQ';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
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

    // Return without image - user can add their own
    return NextResponse.json({
      ...parsedResponse,
      image: '', // Leave empty for user to add
      imageSearchTerm: undefined,
    });
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate gift details. Please try again.' },
      { status: 500 }
    );
  }
}

