import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

interface DetectionResult {
  shouldSplit: boolean
  itemCount: number
  confidence: number
  reason?: string
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }
    
    // Quick heuristic check first
    if (text.length < 30) {
      return NextResponse.json({
        shouldSplit: false,
        itemCount: 1,
        confidence: 1.0,
        reason: 'Text too short'
      })
    }
    
    // Check for obvious list patterns
    const numberedListPattern = /^\d+[\.\)]\s+/gm
    const bulletListPattern = /^[-•*]\s+/gm
    
    if (numberedListPattern.test(text) || bulletListPattern.test(text)) {
      const lines = text.split('\n').filter(line => line.trim().length > 0)
      return NextResponse.json({
        shouldSplit: true,
        itemCount: lines.length,
        confidence: 0.95,
        reason: 'Detected list format'
      })
    }
    
    try {
      // Use AI for more nuanced detection
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Analyze if this text should be split into multiple bullet journal items.

Consider:
- Reflective/journal entries should stay as ONE note
- Lists of distinct tasks/events should be MULTIPLE items
- Related thoughts about the same topic should stay TOGETHER
- Numbered or bulleted lists should be split

Output JSON: {"shouldSplit":boolean,"itemCount":number,"confidence":0.0-1.0,"reason":"brief explanation"}`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 100
      })
      
      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('No response from AI')
      
      const result = JSON.parse(content) as DetectionResult
      
      return NextResponse.json(result)
      
    } catch (aiError) {
      console.warn('[AI] Detection failed, using heuristics:', aiError)
      
      // Fallback to simple heuristics
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10)
      const lines = text.split('\n').filter(line => line.trim().length > 0)
      
      // If we have multiple lines or many sentences, suggest splitting
      const shouldSplit = lines.length > 1 || sentences.length > 2
      const itemCount = Math.max(lines.length, sentences.length > 2 ? sentences.length : 1)
      
      return NextResponse.json({
        shouldSplit,
        itemCount: shouldSplit ? itemCount : 1,
        confidence: 0.6,
        reason: 'Heuristic detection'
      })
    }
    
  } catch (error) {
    console.error('Detection error:', error)
    return NextResponse.json(
      { error: 'Failed to detect items' },
      { status: 500 }
    )
  }
}