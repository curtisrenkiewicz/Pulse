'use client'

import { BulletItemMenu } from './BulletItemMenu'
import { CheckmarkIcon, CrossLargeIcon, CircleIcon, CalendarIcon, PencilWaveIcon, ArrowRightIcon } from '@/components/icons/PulseIcons'
import type { BulletItem } from '@/lib/types'

interface BulletItemWithMenuProps {
  item: Partial<BulletItem>
  isLast?: boolean
  onStateChange?: (newState: { type?: BulletItem['bullet_type'], status?: BulletItem['status'] }) => void
  onMigrate?: (destination: 'next-day' | 'monthly-log' | 'future-log') => void
}

const getIconForItem = (item: Partial<BulletItem>) => {
  // For cancelled items, always show cross
  if (item.status === 'cancelled') {
    return <CrossLargeIcon className="text-[rgba(0,0,0,0.32)]" size={16} />
  }
  
  // For migrated items, always show arrow
  if (item.status === 'migrated') {
    return <ArrowRightIcon className="text-[rgba(0,0,0,0.32)]" size={16} />
  }
  
  switch (item.bullet_type) {
    case 'task':
      if (item.status === 'complete') {
        return <CheckmarkIcon className="text-[rgba(0,0,0,0.32)]" size={16} />
      }
      return <CircleIcon className="text-[rgba(0,0,0,0.32)]" size={16} />
    case 'event':
      return <CalendarIcon className="text-[rgba(0,0,0,0.32)]" size={16} />
    case 'note':
      return <PencilWaveIcon className="text-[rgba(0,0,0,0.32)]" size={16} />
    default:
      return <CircleIcon className="text-[rgba(0,0,0,0.32)]" size={16} />
  }
}

export function BulletItemWithMenu({ item, isLast = false, onStateChange, onMigrate }: BulletItemWithMenuProps) {
  const textColor = item.status === 'cancelled' || item.status === 'complete' 
    ? 'text-[rgba(0,0,0,0.44)]' 
    : 'text-[rgba(0,0,0,0.64)]'
  
  const textDecoration = item.status === 'cancelled' || item.status === 'complete'
    ? 'line-through'
    : ''

  const handleStateChange = (type?: string, status?: string) => {
    onStateChange?.({ 
      type: type as BulletItem['bullet_type'], 
      status: status as BulletItem['status'] 
    })
  }

  return (
    <div className="flex gap-4 items-start w-[720px] relative">
      {/* Left column with icon */}
      <div className="flex flex-col items-center min-h-10 w-5">
        {/* Icon with menu */}
        <BulletItemMenu
          onStateChange={handleStateChange}
          onMigrate={onMigrate}
          currentType={item.bullet_type || 'task'}
          currentStatus={item.status}
        >
          <button className="w-5 h-5 flex items-center justify-center hover:bg-[rgba(0,0,0,0.04)] rounded-md transition-colors cursor-pointer">
            {getIconForItem(item)}
          </button>
        </BulletItemMenu>
      </div>
      
      {/* Connecting line - positioned absolutely to match content height */}
      {!isLast && (
        <div 
          className="absolute left-[10px]" 
          style={{ 
            width: '1.5px', 
            top: '24px', // 20px icon height + 4px gap
            bottom: '0px',
            backgroundColor: 'rgba(0, 0, 0, 0.12)'
          }} 
        />
      )}
      
      {/* Right column - text content */}
      <div className="flex-1 pb-5 pt-0">
        <p className={`text-base leading-5 tracking-[-0.192px] ${textColor} ${textDecoration}`}>
          {item.text}
        </p>
      </div>
    </div>
  )
}