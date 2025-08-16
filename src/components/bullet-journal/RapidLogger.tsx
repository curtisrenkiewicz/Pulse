'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getDefaultSymbol } from '@/lib/bulletSymbols'
import { supabase } from '@/lib/supabase'
import { CircleIcon, CalendarIcon, PencilWaveIcon } from '@/components/icons/PulseIcons'
import type { CategoryResult } from '@/lib/openai'
import type { BulletItem } from '@/lib/types'

interface RapidLoggerProps {
  onItemAdded?: (item: Partial<BulletItem>) => void
  onItemUpdated?: (itemId: string, updates: Partial<BulletItem>) => void
  onPredictionChange?: (hasPrediction: boolean) => void
}

export function RapidLogger({ onItemAdded, onItemUpdated, onPredictionChange }: RapidLoggerProps) {
  const [text, setText] = useState('')
  const [predictedType, setPredictedType] = useState<'task' | 'event' | 'note' | null>(null)
  const [isPredictionReady, setIsPredictionReady] = useState(false)
  const { user } = useAuth()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const analysisTimerRef = useRef<NodeJS.Timeout | null>(null)
  const cachedPredictionRef = useRef<CategoryResult | null>(null)
  const lastAnalyzedTextRef = useRef<string>('')

  // Continuous background analysis while typing
  const analyzeWhileTyping = useCallback(async (inputText: string) => {
    if (!inputText.trim() || !user || inputText.trim().length < 2) {  // Match the 2 char minimum
      setPredictedType(null)
      setIsPredictionReady(false)
      cachedPredictionRef.current = null
      return
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      console.log('Cancelling previous analysis request')
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()
    lastAnalyzedTextRef.current = inputText

    try {
      // Use fast endpoint that skips database lookup for real-time predictions
      const response = await fetch('/api/ai/categorize-fast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText
        }),
        signal: abortControllerRef.current.signal
      })

      if (response.ok) {
        const result: CategoryResult = await response.json()
        
        // Only update if this is still the latest request
        if (lastAnalyzedTextRef.current === inputText) {
          cachedPredictionRef.current = result
          setPredictedType(result.type)
          setIsPredictionReady(true)
          console.log(`Prediction ready: ${result.type} (confidence: ${result.confidence})`)
        }
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        console.log('Request cancelled successfully - no charge incurred')
      } else {
        console.error('Analysis error:', error)
      }
    }
  }, [user])

  // Trigger analysis on text change
  useEffect(() => {
    if (text.trim().length >= 2) {  // Start earlier - after just 2 chars
      // Clear any existing timer
      if (analysisTimerRef.current) {
        clearTimeout(analysisTimerRef.current)
      }

      // Start analysis after minimal delay (50ms)
      // Just enough to group keystrokes from fast typing
      analysisTimerRef.current = setTimeout(() => {
        analyzeWhileTyping(text)
      }, 50)  // Reduced from 150ms to 50ms
    } else {
      setPredictedType(null)
      setIsPredictionReady(false)
      cachedPredictionRef.current = null
    }

    return () => {
      if (analysisTimerRef.current) {
        clearTimeout(analysisTimerRef.current)
      }
    }
  }, [text, analyzeWhileTyping])

  // Notify parent when prediction visibility changes
  useEffect(() => {
    const hasPrediction = predictedType !== null && text.trim().length >= 2
    onPredictionChange?.(hasPrediction)
  }, [predictedType, text, onPredictionChange])

  const saveItem = async () => {
    if (!text.trim() || !user) return

    const trimmedText = text.trim()
    
    // Use cached prediction if available and matches current text
    const finalType = cachedPredictionRef.current && lastAnalyzedTextRef.current === trimmedText
      ? cachedPredictionRef.current.type
      : 'task' // Default to task if no prediction ready
    
    try {
      // Get or create today's daily log
      const today = new Date().toISOString().split('T')[0]
      
      let { data: dailyLog } = await supabase
        .from('daily_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

      // If no daily log exists for today, create one
      if (!dailyLog) {
        const { data: newDailyLog, error: dailyLogError } = await supabase
          .from('daily_logs')
          .insert({
            user_id: user.id,
            date: today,
          })
          .select('id')
          .single()

        if (dailyLogError) {
          console.error('Failed to create daily log:', dailyLogError)
          return
        }
        dailyLog = newDailyLog
      }

      // Create bullet item with predicted type (or default)
      const { data: savedItem, error } = await supabase
        .from('bullet_items')
        .insert({
          user_id: user.id,
          daily_log_id: dailyLog.id,
          text: trimmedText,
          bullet_type: finalType,
          status: 'incomplete',
          symbol: getDefaultSymbol(finalType),
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to save bullet item:', error)
        return
      }

      // Pass the saved item to parent component immediately
      onItemAdded?.(savedItem)
      
      // Clear the input and predictions
      setText('')
      setPredictedType(null)
      setIsPredictionReady(false)
      cachedPredictionRef.current = null
      lastAnalyzedTextRef.current = ''
      
      // If we didn't have a prediction ready, analyze in background and update
      if (!cachedPredictionRef.current || lastAnalyzedTextRef.current !== trimmedText) {
        analyzeAndUpdate(trimmedText, savedItem.id, user.id)
      }
      
    } catch (error) {
      console.error('Failed to save item:', error)
    }
  }

  // Background analysis for items saved without prediction
  const analyzeAndUpdate = async (text: string, itemId: string, userId: string) => {
    try {
      const response = await fetch('/api/ai/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          userId,
        }),
      })

      if (response.ok) {
        const result: CategoryResult = await response.json()
        
        // Only update if the AI suggests a different type than our default
        if (result.type !== 'task') {
          const { error } = await supabase
            .from('bullet_items')
            .update({
              bullet_type: result.type,
              symbol: getDefaultSymbol(result.type),
            })
            .eq('id', itemId)
          
          if (error) {
            console.error('Failed to update bullet type:', error)
          } else {
            // Notify parent component of the update
            onItemUpdated?.(itemId, {
              bullet_type: result.type,
              symbol: getDefaultSymbol(result.type)
            })
          }
        }
      }
    } catch (error) {
      console.error('Background analysis failed:', error)
    }
  }

  const handleKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && text.trim()) {
      e.preventDefault()
      await saveItem()
    }
  }

  const handleBlur = async () => {
    if (text.trim()) {
      await saveItem()
    }
  }

  // Get icon for the predicted type
  const getPredictionIcon = () => {
    if (!predictedType) return null
    
    const iconProps = { 
      className: isPredictionReady 
        ? "text-[rgba(0,0,0,0.32)] transition-opacity duration-200" 
        : "text-[rgba(0,0,0,0.15)] transition-opacity duration-200",
      size: 16 as const 
    }
    
    switch (predictedType) {
      case 'task':
        return <CircleIcon {...iconProps} />
      case 'event':
        return <CalendarIcon {...iconProps} />
      case 'note':
        return <PencilWaveIcon {...iconProps} />
      default:
        return null
    }
  }

  return (
    <div className="relative w-full">
      {/* Show prediction icon inline if ready */}
      {predictedType && text.trim().length >= 2 && (
        <div className="absolute -left-9 top-0 w-5 h-5 flex items-center justify-center">
          <div className={`${isPredictionReady ? 'opacity-60' : 'opacity-20'}`}>
            {getPredictionIcon()}
          </div>
        </div>
      )}
      
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyPress}
        onBlur={handleBlur}
        placeholder="What's on your mind?"
        className="w-full resize-none border-0 focus:ring-0 focus:outline-none text-base font-normal text-[rgba(0,0,0,0.64)] placeholder-[rgba(0,0,0,0.44)] bg-transparent leading-5 tracking-[-0.192px]"
        rows={1}
        style={{ minHeight: '1.25rem' }}
      />
    </div>
  )
}