import { NextRequest, NextResponse } from 'next/server'
import { categorizeText } from '@/lib/openai'
import { getDefaultSymbol } from '@/lib/bulletSymbols'
import type { BulletItem } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const { text, userId } = await request.json()
    
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }
    
    // First, try to intelligently split the text into multiple items
    const segments = await splitTextIntoItems(text)
    
    // Then categorize each segment
    const items = await Promise.all(
      segments.map(async (segment) => {
        const category = await categorizeText(segment, userId)
        return {
          text: segment.trim(),
          bullet_type: category,
          symbol: getDefaultSymbol(category)
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
  // Start with simple heuristics
  const items: string[] = []
  
  // First try to split by newlines
  const lines = text.split('\n').filter(line => line.trim().length > 0)
  
  // If we have multiple lines, use them
  if (lines.length > 1) {
    return lines
  }
  
  // Otherwise, try to split by sentences
  const sentences = text.split(/[.!?]+/)
    .filter(s => s.trim().length > 10)
    .map(s => s.trim())
  
  if (sentences.length > 1) {
    return sentences
  }
  
  // Look for list indicators
  const listPatterns = [
    /^\d+[\.\)]\s*/gm,  // 1. or 1)
    /^[a-z][\.\)]\s*/gim,  // a. or a)
    /^[-•*]\s*/gm,  // Bullet points
    /^(and|also|then|next|finally|first|second|third)\s/gim  // Transition words
  ]
  
  for (const pattern of listPatterns) {
    const matches = text.split(pattern).filter(s => s.trim().length > 0)
    if (matches.length > 1) {
      return matches
    }
  }
  
  // If we can't split it meaningfully, return as single item
  return [text]
}