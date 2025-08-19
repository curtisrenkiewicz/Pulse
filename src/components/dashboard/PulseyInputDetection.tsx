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
      
      try {
        // Call AI detection endpoint
        const response = await fetch('/api/ai/detect-multi-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        })
        
        if (response.ok) {
          const data = await response.json()
          
          // Only show detection if AI is confident we should split
          if (data.shouldSplit && data.confidence > 0.7) {
            setDetection({
              itemCount: data.itemCount,
              message: getDetectionMessage(data.itemCount)
            })
          } else {
            setDetection(null)
          }
        } else {
          // Fallback to simple heuristics if AI fails
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
        }
      } catch (error) {
        console.error('Detection failed:', error)
        setDetection(null)
      }
      
      setIsAnalyzing(false)
    }

    // Debounce the analysis
    const timeout = setTimeout(analyzeText, 500)
    return () => clearTimeout(timeout)
  }, [text])

  const getDetectionMessage = (count: number) => {
    if (count === 2) return "I can split this into 2 items"
    if (count === 3) return "I can organize this into 3 items"
    if (count > 3) return `I can organize this into ${count} items`
    return `I can create ${count} items from this`
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
          className="flex items-center gap-1.5 text-[#999] hover:text-[#666] transition-colors"
        >
          <div className="flex items-center gap-0.5">
            <kbd className="inline-flex items-center justify-center h-4 min-w-[16px] px-0.5 rounded-[5px] bg-[#E8E8E8]">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path 
                  d="M4.625 4.625V3.25C4.625 2.49061 4.00939 1.875 3.25 1.875C2.49061 1.875 1.875 2.49061 1.875 3.25C1.875 4.00939 2.49061 4.625 3.25 4.625H4.625ZM4.625 4.625H7.375M4.625 4.625V7.375M7.375 4.625V3.25C7.375 2.49061 7.9906 1.875 8.75 1.875C9.5094 1.875 10.125 2.49061 10.125 3.25C10.125 4.00939 9.5094 4.625 8.75 4.625H7.375ZM7.375 4.625V7.375M4.625 7.375H7.375M4.625 7.375V8.75C4.625 9.5094 4.00939 10.125 3.25 10.125C2.49061 10.125 1.875 9.5094 1.875 8.75C1.875 7.9906 2.49061 7.375 3.25 7.375H4.625ZM7.375 7.375V8.75C7.375 9.5094 7.9906 10.125 8.75 10.125C9.5094 10.125 10.125 9.5094 10.125 8.75C10.125 7.9906 9.5094 7.375 8.75 7.375H7.375Z" 
                  stroke="#BCBCBC"
                  strokeWidth="1.5" 
                  strokeLinecap="square"
                />
              </svg>
            </kbd>
            <kbd className="inline-flex items-center justify-center h-4 min-w-[16px] px-0.5 rounded-[5px] bg-[#E8E8E8] text-[11px] font-semibold text-[#666666]">
              ↵
            </kbd>
          </div>
          <span className="text-[12px] font-medium">Preview</span>
        </button>
      )}
    </div>
  )
}