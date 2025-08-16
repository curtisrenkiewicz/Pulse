import { NextRequest, NextResponse } from 'next/server'
import { categorizeText } from '@/lib/openai'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { text, userId } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user's recent corrections to improve accuracy
    // Increased from 10 to 20 for better personalization over time
    const supabase = createServerSupabaseClient()
    const { data: corrections } = await supabase
      .from('ai_corrections')
      .select('original_text, ai_predicted_type, user_corrected_type')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    const userCorrections = corrections?.map(c => ({
      text: c.original_text,
      predicted: c.ai_predicted_type,
      actual: c.user_corrected_type,
    })) || []

    // Categorize the text
    const result = await categorizeText(text, userCorrections)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Categorization error:', error)
    return NextResponse.json(
      { error: 'Failed to categorize text' },
      { status: 500 }
    )
  }
}