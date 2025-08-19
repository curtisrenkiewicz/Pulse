'use client'

import { useState, useEffect } from 'react'
import { PulseyAvatar } from '@/components/icons/PulseIcons'

interface PulseyInputDetectionProps {
  text: string
  onPreview?: () => void
}

interface Detection {
  itemCount: number
  message: string
}

export function PulseyInputDetection({ text, onPreview }: PulseyInputDetectionProps) {
  const [detection, setDetection] = useState<Detection | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    const analyzeText = async () => {
      // Don't analyze short text
      if (text.length < 30) {
        setDetection(null)
        return
      }

      setIsAnalyzing(true)
      
      // Quick heuristic analysis first for immediate feedback
      const lines = text.split('\n').filter(line => line.trim().length > 0)
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10)
      
      const estimatedCount = Math.max(lines.length, sentences.length)
      
      if (estimatedCount > 1) {
        setDetection({
          itemCount: estimatedCount,
          message: getDetectionMessage(estimatedCount)
        })
      } else {
        setDetection(null)
      }
      
      setIsAnalyzing(false)
    }

    // Debounce the analysis - reduced for faster feedback
    const timeout = setTimeout(analyzeText, 200)
    return () => clearTimeout(timeout)
  }, [text])

  const getDetectionMessage = (count: number) => {
    if (count === 2) return "I'll create 2 items from this"
    if (count === 3) return "I'll organize this into 3 items"
    if (count > 3) return "I'll help organize your thoughts"
    return `I'll create ${count} items from this`
  }

  if (!detection) return null

  return (
    <div className="flex items-center justify-between px-4 py-2 animate-fadeIn">
      <div className="flex items-center gap-2">
        <PulseyAvatar 
          size={16} 
          className={isAnalyzing ? 'animate-pulse' : ''}
        />
        <span className="text-[#666] text-[12px] font-medium">
          {detection.message}
        </span>
      </div>
      
      {onPreview && (
        <button 
          onClick={onPreview}
          className="text-[#999] hover:text-[#666] text-[12px] flex items-center gap-1 transition-colors"
        >
          <kbd className="px-1 py-0.5 bg-[#f0f0f0] rounded text-[10px] font-medium">
            ⌘↵
          </kbd>
          <span>Preview</span>
        </button>
      )}
    </div>
  )
}