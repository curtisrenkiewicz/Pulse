'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CheckmarkIcon, CrossSmallIcon, ArrowRightIcon, ArrowLeftIcon, CalendarIcon, PencilWaveIcon, CircleIcon } from '@/components/icons/PulseIcons'

interface BulletItemMenuProps {
  children: React.ReactNode
  onStateChange: (type?: string, status?: string) => void
  onMigrate?: (destination: 'today' | 'next-day' | 'monthly-log' | 'future-log') => void
  currentType: string
  currentStatus?: string
}

export function BulletItemMenu({ 
  children, 
  onStateChange,
  onMigrate,
  currentType,
  currentStatus
}: BulletItemMenuProps) {
  const [showMigrationOptions, setShowMigrationOptions] = useState(false)
  
  const handleMigrateClick = () => {
    setShowMigrationOptions(true)
  }
  
  const handleMigrationSelect = (destination: 'today' | 'next-day' | 'monthly-log' | 'future-log') => {
    onMigrate?.(destination)
    setShowMigrationOptions(false)
  }
  
  return (
    <DropdownMenu onOpenChange={(open) => !open && setShowMigrationOptions(false)}>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-[180px] bg-white rounded-xl border border-[rgba(0,0,0,0.05)] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] py-1 px-0"
        align="start"
      >
        {showMigrationOptions ? (
          /* Migration options view */
          <div className="px-1 py-0">
            {/* Today */}
            <DropdownMenuItem 
              className="flex items-center gap-2.5 px-2 py-1 h-7 rounded-lg hover:bg-[rgba(0,0,0,0.03)] focus:bg-[rgba(0,0,0,0.03)] cursor-pointer"
              onClick={() => handleMigrationSelect('today')}
            >
              <CalendarIcon className="text-[rgba(0,0,0,0.44)]" size={20} />
              <span className="text-sm font-medium text-[rgba(0,0,0,0.88)] font-['Inter']">Today</span>
            </DropdownMenuItem>
            
            {/* Next Day */}
            <DropdownMenuItem 
              className="flex items-center gap-2.5 px-2 py-1 h-7 rounded-lg hover:bg-[rgba(0,0,0,0.03)] focus:bg-[rgba(0,0,0,0.03)] cursor-pointer"
              onClick={() => handleMigrationSelect('next-day')}
            >
              <CalendarIcon className="text-[rgba(0,0,0,0.44)]" size={20} />
              <span className="text-sm font-medium text-[rgba(0,0,0,0.88)] font-['Inter']">Tomorrow</span>
            </DropdownMenuItem>
            
            {/* Monthly Log */}
            <DropdownMenuItem 
              className="flex items-center gap-2.5 px-2 py-1 h-7 rounded-lg hover:bg-[rgba(0,0,0,0.03)] focus:bg-[rgba(0,0,0,0.03)] cursor-pointer"
              onClick={() => handleMigrationSelect('monthly-log')}
            >
              <CalendarIcon className="text-[rgba(0,0,0,0.44)]" size={20} />
              <span className="text-sm font-medium text-[rgba(0,0,0,0.88)] font-['Inter']">Monthly Log</span>
            </DropdownMenuItem>
            
            {/* Future Log (disabled) */}
            <DropdownMenuItem 
              className="flex items-center gap-2.5 px-2 py-1 h-7 rounded-lg cursor-not-allowed"
              disabled
            >
              <CalendarIcon className="text-[rgba(0,0,0,0.2)]" size={20} />
              <span className="text-sm font-medium text-[rgba(0,0,0,0.32)] font-['Inter']">Future Log</span>
            </DropdownMenuItem>
          </div>
        ) : (
          <>
            {/* Task state options - only show for tasks */}
            {currentType === 'task' && (
              <>
                <div className="px-1 py-0">
                  {currentStatus !== 'complete' && (
                    <DropdownMenuItem 
                      className="flex items-center gap-2.5 px-2 py-1 h-7 rounded-lg hover:bg-[rgba(0,0,0,0.03)] focus:bg-[rgba(0,0,0,0.03)] cursor-pointer"
                      onClick={() => onStateChange(undefined, 'complete')}
                    >
                      <CheckmarkIcon className="text-[rgba(0,0,0,0.44)]" size={20} />
                      <span className="text-sm font-medium text-[rgba(0,0,0,0.88)] font-['Inter']">Complete</span>
                    </DropdownMenuItem>
                  )}
                  
                  {currentStatus !== 'cancelled' && (
                    <DropdownMenuItem 
                      className="flex items-center gap-2.5 px-2 py-1 h-7 rounded-lg hover:bg-[rgba(0,0,0,0.03)] focus:bg-[rgba(0,0,0,0.03)] cursor-pointer"
                      onClick={() => onStateChange(undefined, 'cancelled')}
                    >
                      <CrossSmallIcon className="text-[rgba(0,0,0,0.44)]" size={20} />
                      <span className="text-sm font-medium text-[rgba(0,0,0,0.88)] font-['Inter']">Cancel</span>
                    </DropdownMenuItem>
                  )}
                  
                  {currentStatus !== 'scheduled' && (
                    <DropdownMenuItem 
                      className="flex items-center gap-2.5 px-2 py-1 h-7 rounded-lg hover:bg-[rgba(0,0,0,0.03)] focus:bg-[rgba(0,0,0,0.03)] cursor-pointer"
                      onClick={() => onStateChange(undefined, 'scheduled')}
                    >
                      <ArrowLeftIcon className="text-[rgba(0,0,0,0.44)]" size={20} />
                      <span className="text-sm font-medium text-[rgba(0,0,0,0.88)] font-['Inter']">Schedule</span>
                    </DropdownMenuItem>
                  )}
                  
                  {currentStatus !== 'migrated' && (
                    <DropdownMenuItem 
                      className="flex items-center gap-2.5 px-2 py-1 h-7 rounded-lg hover:bg-[rgba(0,0,0,0.03)] focus:bg-[rgba(0,0,0,0.03)] cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault()
                        handleMigrateClick()
                      }}
                      onSelect={(e) => e.preventDefault()}
                    >
                      <ArrowRightIcon className="text-[rgba(0,0,0,0.44)]" size={20} />
                      <span className="text-sm font-medium text-[rgba(0,0,0,0.88)] font-['Inter']">Migrate</span>
                    </DropdownMenuItem>
                  )}
                </div>
                
                <div className="py-1">
                  <DropdownMenuSeparator className="bg-[rgba(0,0,0,0.1)] h-[0.5px]" />
                </div>
              </>
            )}
            
            {/* Type change options */}
            <div className="px-1 py-0">
              {/* Header */}
              <div className="px-2 py-1">
                <span className="text-xs font-normal text-[rgba(0,0,0,0.44)] font-['Inter']">Change type</span>
              </div>
              
              {currentType !== 'event' && (
                <DropdownMenuItem 
                  className="flex items-center gap-2.5 px-2 py-1 h-7 rounded-lg hover:bg-[rgba(0,0,0,0.03)] focus:bg-[rgba(0,0,0,0.03)] cursor-pointer"
                  onClick={() => onStateChange('event', 'incomplete')}
                >
                  <CalendarIcon className="text-[rgba(0,0,0,0.44)]" size={20} />
                  <span className="text-sm font-medium text-[rgba(0,0,0,0.88)] font-['Inter']">Event</span>
                </DropdownMenuItem>
              )}
              
              {currentType !== 'note' && (
                <DropdownMenuItem 
                  className="flex items-center gap-2.5 px-2 py-1 h-7 rounded-lg hover:bg-[rgba(0,0,0,0.03)] focus:bg-[rgba(0,0,0,0.03)] cursor-pointer"
                  onClick={() => onStateChange('note', 'incomplete')}
                >
                  <PencilWaveIcon className="text-[rgba(0,0,0,0.44)]" size={20} />
                  <span className="text-sm font-medium text-[rgba(0,0,0,0.88)] font-['Inter']">Note</span>
                </DropdownMenuItem>
              )}
              
              {currentType !== 'task' && (
                <DropdownMenuItem 
                  className="flex items-center gap-2.5 px-2 py-1 h-7 rounded-lg hover:bg-[rgba(0,0,0,0.03)] focus:bg-[rgba(0,0,0,0.03)] cursor-pointer"
                  onClick={() => onStateChange('task', 'incomplete')}
                >
                  <CircleIcon className="text-[rgba(0,0,0,0.44)]" size={20} />
                  <span className="text-sm font-medium text-[rgba(0,0,0,0.88)] font-['Inter']">Task</span>
                </DropdownMenuItem>
              )}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}