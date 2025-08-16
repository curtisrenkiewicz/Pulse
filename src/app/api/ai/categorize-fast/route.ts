import { NextRequest, NextResponse } from 'next/server'
import { categorizeText } from '@/lib/openai'

// Fast version that skips database lookup for real-time predictions
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // Skip user corrections for speed - just do basic categorization
    const result = await categorizeText(text, [])

    return NextResponse.json(result)
  } catch (error) {
    console.error('Fast categorization error:', error)
    return NextResponse.json(
      { error: 'Failed to categorize text' },
      { status: 500 }
    )
  }
}