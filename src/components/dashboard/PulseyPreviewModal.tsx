'use client'

import { useState, useEffect } from 'react'
import { CrossLargeIcon, PulseyAvatar, CheckmarkIcon } from '@/components/icons/PulseIcons'
import { getDefaultSymbol } from '@/lib/bulletSymbols'
import type { BulletItem } from '@/lib/types'

interface PreviewItem {
  text: string
  bullet_type: BulletItem['bullet_type']
  symbol: string
}

interface PulseyPreviewModalProps {
  text: string
  isOpen: boolean
  onClose: () => void
  onConfirm: (items: PreviewItem[]) => void
}

export function PulseyPreviewModal({ text, isOpen, onClose, onConfirm }: PulseyPreviewModalProps) {
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  useEffect(() => {
    if (!isOpen || !text) return
    
    const analyzeText = async () => {
      setIsAnalyzing(true)
      
      try {
        // Call the AI endpoint to parse and categorize
        const response = await fetch('/api/ai/parse-multi-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        })
        
        if (response.ok) {
          const data = await response.json()
          setPreviewItems(data.items)
        } else {
          // Fallback to heuristics if AI fails
          const lines = text.split('\n').filter(line => line.trim().length > 0)
          const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10)
          
          const textSegments = lines.length > sentences.length ? lines : sentences
          
          const items: PreviewItem[] = textSegments.map(segment => {
            const trimmed = segment.trim()
            let type: BulletItem['bullet_type'] = 'task'
            
            if (trimmed.includes('meeting') || trimmed.includes('call') || trimmed.includes('appointment')) {
              type = 'event'
            } else if (trimmed.includes('remember') || trimmed.includes('note') || trimmed.includes('thought')) {
              type = 'note'
            }
            
            return {
              text: trimmed,
              bullet_type: type,
              symbol: getDefaultSymbol(type)
            }
          })
          
          setPreviewItems(items)
        }
      } catch (error) {
        console.error('Failed to parse items:', error)
        // Fallback to simple split
        setPreviewItems([{
          text: text.trim(),
          bullet_type: 'task',
          symbol: getDefaultSymbol('task')
        }])
      }
      
      setIsAnalyzing(false)
    }
    
    analyzeText()
  }, [text, isOpen])
  
  if (!isOpen) return null
  
  const handleConfirm = () => {
    onConfirm(previewItems)
    onClose()
  }
  
  const getIconForType = (type: BulletItem['bullet_type']) => {
    switch (type) {
      case 'task':
        return '○'
      case 'event':
        return '◇'
      case 'note':
        return '—'
      default:
        return '○'
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-[640px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[rgba(0,0,0,0.07)]">
          <div className="flex items-center gap-3">
            <PulseyAvatar size={24} />
            <div>
              <h2 className="text-lg font-semibold text-[rgba(0,0,0,0.88)]">
                I'll organize this into {previewItems.length} items
              </h2>
              <p className="text-sm text-[rgba(0,0,0,0.44)]">
                Review and adjust before adding to your timeline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[rgba(0,0,0,0.04)] rounded-lg transition-colors"
          >
            <CrossLargeIcon size={20} className="text-[rgba(0,0,0,0.44)]" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isAnalyzing ? (
            <div className="flex items-center justify-center py-12">
              <PulseyAvatar size={32} className="animate-pulse" />
            </div>
          ) : (
            <div className="space-y-4">
              {previewItems.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border border-[rgba(0,0,0,0.07)] hover:bg-[rgba(0,0,0,0.02)] transition-colors"
                >
                  <span className="text-[rgba(0,0,0,0.44)] text-lg mt-0.5">
                    {getIconForType(item.bullet_type)}
                  </span>
                  <div className="flex-1">
                    <p className="text-base text-[rgba(0,0,0,0.88)]">
                      {item.text}
                    </p>
                    <span className="text-xs text-[rgba(0,0,0,0.32)] mt-1">
                      {item.bullet_type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-[rgba(0,0,0,0.07)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[rgba(0,0,0,0.44)] hover:text-[rgba(0,0,0,0.66)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isAnalyzing || previewItems.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#20B9F4] text-white rounded-lg hover:bg-[#1BA8E0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckmarkIcon size={16} className="text-white" />
            Add {previewItems.length} items
          </button>
        </div>
      </div>
    </div>
  )
}