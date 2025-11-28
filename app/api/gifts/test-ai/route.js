import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function GET() {
  try {
    // Check if API key is set
    if (!GEMINI_API_KEY) {
      return NextResponse.json({
        status: 'error',
        message: 'GEMINI_API_KEY is not set in environment variables',
        hasKey: false,
      }, { status: 500 });
    }

    // Check key length (basic validation)
    if (GEMINI_API_KEY.length < 20) {
      return NextResponse.json({
        status: 'warning',
        message: 'GEMINI_API_KEY seems too short (may be invalid)',
        hasKey: true,
        keyLength: GEMINI_API_KEY.length,
      }, { status: 200 });
    }

    // Try to initialize the client
    let genAI;
    try {
      genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    } catch (initError) {
      return NextResponse.json({
        status: 'error',
        message: `Failed to initialize Gemini client: ${initError.message}`,
        hasKey: true,
      }, { status: 500 });
    }

    // Try to get a model
    let model;
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    } catch (modelError) {
      return NextResponse.json({
        status: 'error',
        message: `Failed to get model: ${modelError.message}`,
        hasKey: true,
      }, { status: 500 });
    }

    // Try a simple API call
    try {
      const result = await model.generateContent('Say "Hello" in one word.');
      const response = await result.response;
      const text = response.text();

      return NextResponse.json({
        status: 'success',
        message: 'AI is working correctly!',
        hasKey: true,
        keyLength: GEMINI_API_KEY.length,
        testResponse: text,
      });
    } catch (apiError) {
      return NextResponse.json({
        status: 'error',
        message: `API call failed: ${apiError.message}`,
        hasKey: true,
        keyLength: GEMINI_API_KEY.length,
        errorDetails: {
          name: apiError.name,
          message: apiError.message,
          statusCode: apiError.statusCode,
        },
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: `Unexpected error: ${error.message}`,
      errorDetails: {
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    }, { status: 500 });
  }
}

