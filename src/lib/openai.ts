import OpenAI from 'openai'
import { AI_MODELS, CATEGORIZATION_PROMPT, MONITORING } from '@/config/ai.config'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export interface CategoryResult {
  type: 'task' | 'event' | 'note'
  confidence: number
  reasoning?: string
}

// Rule-based fallback for offline/error cases
export function ruleBased(text: string): CategoryResult {
  const lowerText = text.toLowerCase()
  
  // Task indicators
  const taskKeywords = [
    'buy', 'get', 'call', 'email', 'send', 'finish', 'complete', 'do', 'make',
    'schedule', 'book', 'order', 'pay', 'review', 'update', 'fix', 'create',
    'write', 'prepare', 'organize', 'plan', 'research', 'check', 'confirm'
  ]
  
  // Event indicators
  const eventKeywords = [
    'meeting', 'lunch', 'dinner', 'appointment', 'call with', 'conference',
    'party', 'event', 'workshop', 'presentation', 'interview', 'date',
    'birthday', 'anniversary', 'vacation', 'trip', 'flight'
  ]
  
  // Check for task patterns
  const hasTaskKeyword = taskKeywords.some(keyword => lowerText.includes(keyword))
  const hasEventKeyword = eventKeywords.some(keyword => lowerText.includes(keyword))
  
  // Time indicators suggest events
  const hasTimeIndicator = /\b(at \d|tomorrow|today|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d+:\d+|am|pm)\b/.test(lowerText)
  
  if (hasEventKeyword || (hasTimeIndicator && !hasTaskKeyword)) {
    return { type: 'event', confidence: 0.7 }
  }
  
  if (hasTaskKeyword) {
    return { type: 'task', confidence: 0.8 }
  }
  
  // Default to note if unclear
  return { type: 'note', confidence: 0.5 }
}

export async function categorizeText(
  text: string, 
  userCorrections?: Array<{ text: string; predicted: string; actual: string }>
): Promise<CategoryResult> {
  const startTime = Date.now()
  
  // Try each model in order until one succeeds
  for (const config of AI_MODELS) {
    try {
      // Build context from user corrections
      // Use more corrections (up to 5) for better personalization
      const correctionContext = userCorrections?.length 
        ? `\n\nUser patterns:\n${userCorrections.slice(0, 5).map(c => 
            `"${c.text}" → ${c.actual}`
          ).join('\n')}`
        : ''

      const response = await openai.chat.completions.create({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: CATEGORIZATION_PROMPT + correctionContext
          },
          {
            role: 'user',
            content: text
          }
        ],
        ...(config.reasoning_effort && { reasoning_effort: config.reasoning_effort as any }),
        ...(config.verbosity && { verbosity: config.verbosity as any }),
        ...(config.max_completion_tokens && { max_completion_tokens: config.max_completion_tokens }),
        ...(config.max_tokens && { max_tokens: config.max_tokens }),
        temperature: config.temperature,
      })

      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('No response from AI')
      
      const result = JSON.parse(content) as CategoryResult
      
      // Validate the response
      if (!['task', 'event', 'note'].includes(result.type)) {
        throw new Error('Invalid category returned')
      }
      
      // Log performance metrics
      const duration = Date.now() - startTime
      if (MONITORING.enabled) {
        console.log(`[AI] Categorized in ${duration}ms using ${config.model}`)
        
        if (MONITORING.logSlowRequests && duration > MONITORING.slowRequestThreshold) {
          console.warn(`[AI] Slow categorization: ${duration}ms for "${text.substring(0, 50)}..."`)
        }
      }
      
      return result
      
    } catch (error) {
      console.warn(`[AI] Failed with ${config.model}:`, error)
      // Continue to next model
    }
  }
  
  // All models failed, fall back to rule-based
  console.warn('[AI] All models failed, using rule-based categorization')
  const duration = Date.now() - startTime
  const result = ruleBased(text)
  
  if (MONITORING.enabled) {
    console.log(`[AI] Rule-based categorization in ${duration}ms`)
  }
  
  return result
}