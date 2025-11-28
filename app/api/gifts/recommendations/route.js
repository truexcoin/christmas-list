import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireAuth } from '@/lib/auth';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDTnLjjBnpc8nIJFT5Vmr_uL4o9_KfW1XQ';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', text);
      return NextResponse.json(
        { error: 'Failed to parse AI recommendations. Please try again.' },
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

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations. Please try again.' },
      { status: 500 }
    );
  }
}

