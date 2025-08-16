/**
 * AI Configuration for Pulse
 * Centralized configuration for AI model settings and fallback strategies
 */

export interface AIModelConfig {
  model: string
  reasoning_effort?: 'minimal' | 'low' | 'medium' | 'high'
  verbosity?: 'low' | 'medium' | 'high'
  temperature: number
  max_tokens?: number
  max_completion_tokens?: number
  timeout?: number
}

// Model configurations in order of preference
export const AI_MODELS: AIModelConfig[] = [
  {
    // Primary: GPT-5-nano with minimal reasoning for fastest response
    model: 'gpt-5-nano',
    reasoning_effort: 'minimal',
    verbosity: 'low',
    temperature: 0.1,
    max_completion_tokens: 50,  // GPT-5 uses max_completion_tokens
    timeout: 2000  // 2 second timeout
  },
  {
    // Fallback 1: GPT-5-mini if nano fails
    model: 'gpt-5-mini',
    reasoning_effort: 'minimal',
    verbosity: 'low',
    temperature: 0.1,
    max_completion_tokens: 50,  // GPT-5 uses max_completion_tokens
    timeout: 3000
  },
  {
    // Fallback 2: GPT-4o-mini (pre-GPT-5 model)
    model: 'gpt-4o-mini',
    temperature: 0.1,
    max_tokens: 50,
    timeout: 3000
  },
  {
    // Fallback 3: GPT-3.5-turbo (most reliable, always available)
    model: 'gpt-3.5-turbo',
    temperature: 0.1,
    max_tokens: 100,
    timeout: 5000
  }
]

// System prompt optimized for speed
export const CATEGORIZATION_PROMPT = `Categorize bullet journal entry as:
task: action item/todo
event: scheduled/time-based
note: thought/info

Output JSON only: {"type":"task|event|note","confidence":0.0-1.0}`

// Performance monitoring configuration
export const MONITORING = {
  enabled: true,
  logSlowRequests: true,
  slowRequestThreshold: 1500,  // Log requests slower than 1.5s
  collectMetrics: true
}

// Feature flags for testing
export const FEATURES = {
  useOptimisticUI: false,      // Show item immediately while categorizing
  showCategorizingIndicator: true,  // Show "Analyzing..." text
  enableResponseCaching: true,      // Cache similar categorizations
  maxCacheSize: 100,                // Maximum cached responses
  cacheExpiryMs: 3600000            // 1 hour cache expiry
}

// Model-specific optimizations
export const MODEL_OPTIMIZATIONS = {
  'gpt-5-nano': {
    promptStrategy: 'minimal',  // Use shortest possible prompts
    includeExamples: false,      // Skip examples for speed
    preamble: false              // No tool preambles needed
  },
  'gpt-5-mini': {
    promptStrategy: 'balanced',
    includeExamples: true,
    preamble: false
  },
  'gpt-5': {
    promptStrategy: 'detailed',
    includeExamples: true,
    preamble: true  // Enable preambles for better accuracy
  }
}

export default {
  AI_MODELS,
  CATEGORIZATION_PROMPT,
  MONITORING,
  FEATURES,
  MODEL_OPTIMIZATIONS
}