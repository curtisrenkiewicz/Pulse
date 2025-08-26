import { NextRequest, NextResponse } from 'next/server'
import { categorizeText } from '@/lib/openai'
import { getDefaultSymbol } from '@/lib/bulletSymbols'
import { createServerSupabaseClient } from '@/lib/supabase'
import OpenAI from 'openai'
import type { BulletItem } from '@/lib/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { text, userId } = await request.json()
    
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }
    
    // Get user's recent corrections to improve accuracy
    let userCorrections: Array<{ text: string; predicted: string; actual: string }> = []
    if (userId) {
      const supabase = createServerSupabaseClient()
      const { data: corrections } = await supabase
        .from('ai_corrections')
        .select('original_text, ai_predicted_type, user_corrected_type')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)
      
      userCorrections = corrections?.map(c => ({
        text: c.original_text,
        predicted: c.ai_predicted_type,
        actual: c.user_corrected_type,
      })) || []
    }
    
    // First, try to intelligently split the text into multiple items
    const segments = await splitTextIntoItems(text)
    
    // Then categorize each segment
    const items = await Promise.all(
      segments.map(async (segment) => {
        const category = await categorizeText(segment, userCorrections)
        return {
          text: segment.trim(),
          bullet_type: category.type,
          symbol: getDefaultSymbol(category.type)
        }
      })
    )
    
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Failed to parse multi-items:', error)
    return NextResponse.json(
      { error: 'Failed to parse items' },
      { status: 500 }
    )
  }
}

async function splitTextIntoItems(text: string): Promise<string[]> {
  // Check for obvious list patterns first
  const numberedListPattern = /^\d+[\.\)]\s+/gm
  const bulletListPattern = /^[-•*]\s+/gm
  
  // If it's a clear list, split by lines
  if (numberedListPattern.test(text) || bulletListPattern.test(text)) {
    return text.split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^\d+[\.\)]\s+|^[-•*]\s+/, '').trim())
  }
  
  try {
    // Use AI for intelligent splitting
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Split text into separate bullet journal items if appropriate.

Rules:
- Keep related thoughts/reflections together as ONE item
- Split distinct tasks, events, or unrelated notes
- Preserve the original meaning and context
- Don't split mid-sentence or mid-thought
- Journal entries about the same topic stay together

Output JSON array of text segments: ["item1", "item2", ...]
If text should NOT be split, return array with single item.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    })
    
    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('No response from AI')
    
    const segments = JSON.parse(content) as string[]
    
    // Validate the response
    if (!Array.isArray(segments) || segments.length === 0) {
      throw new Error('Invalid segments returned')
    }
    
    return segments.map(s => s.trim()).filter(s => s.length > 0)
    
  } catch (error) {
    console.warn('[AI] Splitting failed, using fallback:', error)
    
    // Fallback to simple heuristics
    const lines = text.split('\n').filter(line => line.trim().length > 0)
    
    // If we have multiple lines, use them
    if (lines.length > 1) {
      return lines
    }
    
    // Otherwise, return as single item
    return [text]
  }
}