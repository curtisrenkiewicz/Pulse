'use client'

import type { BulletItem } from '@/lib/types'

interface BulletItemSimpleProps {
  item: Partial<BulletItem>
  isLast?: boolean
}

const getIconForItem = (item: Partial<BulletItem>) => {
  // For cancelled items, always show cross
  if (item.status === 'cancelled') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3.16667 3.16667L12.8333 12.8333M12.8333 3.16667L3.16667 12.8333" 
          stroke="black" strokeOpacity="0.32" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  }
  
  switch (item.bullet_type) {
    case 'task':
      if (item.status === 'complete') {
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3.16667 3.16667L12.8333 12.8333M12.8333 3.16667L3.16667 12.8333" 
              stroke="black" strokeOpacity="0.32" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )
      }
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.4" stroke="black" strokeOpacity="0.32" strokeWidth="1.2"/>
        </svg>
      )
    case 'event':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="1.5" fill="black" fillOpacity="0.32"/>
        </svg>
      )
    case 'note':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="4" y="7" width="8" height="2" rx="1" fill="black" fillOpacity="0.32"/>
        </svg>
      )
    default:
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.4" stroke="black" strokeOpacity="0.32" strokeWidth="1.2"/>
        </svg>
      )
  }
}

export function BulletItemSimple({ item, isLast = false }: BulletItemSimpleProps) {
  const textColor = item.status === 'cancelled' || item.status === 'complete' 
    ? 'text-[rgba(0,0,0,0.44)]' 
    : 'text-[rgba(0,0,0,0.64)]'
  
  const textDecoration = item.status === 'cancelled' || item.status === 'complete'
    ? 'line-through'
    : ''

  return (
    <div className="flex gap-4 items-start w-[720px]">
      {/* Left column with icon and line */}
      <div className="flex flex-col items-center min-h-10 w-5 relative">
        {/* Icon */}
        <div className="w-5 h-5 flex items-center justify-center">
          {getIconForItem(item)}
        </div>
        
        {/* Connecting line */}
        {!isLast && (
          <div className="flex-1 w-full flex items-center justify-center min-h-4">
            <div className="w-0.5 h-full bg-[rgba(0,0,0,0.06)]" />
          </div>
        )}
      </div>
      
      {/* Right column - text content */}
      <div className="flex-1 pb-5 pt-0">
        <p className={`text-base leading-5 tracking-[-0.192px] ${textColor} ${textDecoration}`}>
          {item.text}
        </p>
      </div>
    </div>
  )
}