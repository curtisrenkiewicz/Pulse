'use client'

import { useState } from 'react'
import { getDefaultSymbol, getSymbolForStatus } from '@/lib/bulletSymbols'
import { Check, X, ArrowRight, Clock, Circle, Calendar, Minus, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BulletItem } from '@/lib/types'

interface BulletItemProps {
  item: Partial<BulletItem>
  onStateChange?: (newState: { type?: BulletItem['bullet_type'], status?: BulletItem['status'] }) => void
}

export function BulletItem({ item, onStateChange }: BulletItemProps) {
  const [showMenu, setShowMenu] = useState(false)

  const handleStateChange = (type?: BulletItem['bullet_type'], status?: BulletItem['status']) => {
    onStateChange?.({ type, status })
    setShowMenu(false)
  }

  const getMenuOptions = () => {
    const options = []
    
    // Task-specific options
    if (item.bullet_type === 'task') {
      if (item.status !== 'complete') {
        options.push({ 
          icon: Check, 
          symbol: '✓', 
          label: 'Complete', 
          action: () => handleStateChange(undefined, 'complete'),
          variant: 'default' as const
        })
      }
      if (item.status !== 'cancelled') {
        options.push({ 
          icon: X, 
          symbol: '✗', 
          label: 'Cancel', 
          action: () => handleStateChange(undefined, 'cancelled'),
          variant: 'destructive' as const
        })
      }
      if (item.status !== 'migrated') {
        options.push({ 
          icon: ArrowRight, 
          symbol: '→', 
          label: 'Migrate', 
          action: () => handleStateChange(undefined, 'migrated'),
          variant: 'default' as const
        })
      }
      if (item.status !== 'scheduled') {
        options.push({ 
          icon: Clock, 
          symbol: '<', 
          label: 'Schedule', 
          action: () => handleStateChange(undefined, 'scheduled'),
          variant: 'default' as const
        })
      }
    }

    // Universal cancel option for non-tasks
    if (item.bullet_type !== 'task' && item.status !== 'cancelled') {
      options.push({ 
        icon: X, 
        symbol: '✗', 
        label: 'Cancel', 
        action: () => handleStateChange(undefined, 'cancelled'),
        variant: 'destructive' as const
      })
    }

    // Migration options for notes
    if (item.bullet_type === 'note' && item.status !== 'migrated') {
      options.push({ 
        icon: ArrowRight, 
        symbol: '→', 
        label: 'Migrate to Collection', 
        action: () => handleStateChange(undefined, 'migrated'),
        variant: 'default' as const
      })
    }

    // Type correction options
    if (item.bullet_type !== 'task') {
      options.push({ 
        icon: Circle, 
        symbol: '○', 
        label: 'Task', 
        action: () => handleStateChange('task', 'incomplete'),
        variant: 'secondary' as const
      })
    }
    if (item.bullet_type !== 'event') {
      options.push({ 
        icon: Calendar, 
        symbol: '•', 
        label: 'Event', 
        action: () => handleStateChange('event', 'incomplete'),
        variant: 'secondary' as const
      })
    }
    if (item.bullet_type !== 'note') {
      options.push({ 
        icon: Minus, 
        symbol: '-', 
        label: 'Note', 
        action: () => handleStateChange('note', 'incomplete'),
        variant: 'secondary' as const
      })
    }

    return options
  }

  return (
    <div className="group flex items-start gap-4 py-0 relative w-[720px]">
      {/* Left column - Symbol with connecting line */}
      <div className="flex flex-col items-center justify-start min-h-10">
        {/* Interactive Symbol with expanded hover area */}
        <div 
          className="flex items-center justify-center w-5 h-5 relative cursor-pointer hover:bg-neutral-100 rounded transition-colors"
          onMouseEnter={() => setShowMenu(true)}
          onMouseLeave={() => setShowMenu(false)}
        >
          <span className="text-base font-medium text-neutral-800 select-none">
            {item.symbol}
          </span>

          {/* Expanded hover area and menu */}
          {showMenu && (
            <div 
              className="absolute top-0 left-0 z-10"
              onMouseEnter={() => setShowMenu(true)}
              onMouseLeave={() => setShowMenu(false)}
            >
              {/* Invisible bridge to prevent hover gaps */}
              <div className="absolute top-0 left-0 w-48 h-5" />
              
              {/* Actual menu */}
              <div className="absolute top-0 left-6 bg-white border border-neutral-200 rounded-lg shadow-lg py-2 min-w-48">
                {getMenuOptions().map((option, index) => {
                  const IconComponent = option.icon
                  return (
                    <Button
                      key={index}
                      variant={option.variant || "ghost"}
                      size="sm"
                      onClick={option.action}
                      className="w-full justify-start h-9 px-3 text-sm font-normal gap-3 hover:bg-neutral-100"
                    >
                      <IconComponent className="h-4 w-4 flex-shrink-0" />
                      <span className="font-mono text-base">{option.symbol}</span>
                      <span className="flex-1 text-left">{option.label}</span>
                    </Button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* Connecting line (grows to fill remaining height) */}
        <div className="flex-1 flex items-center justify-center min-h-4 min-w-4 w-full">
          <div className="w-0.5 h-full bg-neutral-200 rounded-full" />
        </div>
      </div>
      
      {/* Right column - Item Content */}
      <div className="flex-1 min-w-0 pb-5 pt-0 px-0 rounded-[20px]">
        <span className={`text-base font-normal leading-5 tracking-[-0.192px] ${
          item.status === 'complete' ? 'line-through text-[rgba(0,0,0,0.44)]' : 'text-[rgba(0,0,0,0.64)]'
        } ${
          item.status === 'cancelled' ? 'line-through text-[rgba(0,0,0,0.44)]' : ''
        }`}>
          {item.text}
        </span>
      </div>
    </div>
  )
}