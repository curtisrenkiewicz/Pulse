'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { RapidLogger } from '@/components/bullet-journal/RapidLogger'
import { BulletItemWithMenu } from '@/components/bullet-journal/BulletItemWithMenu'
import { getDefaultSymbol, getSymbolForStatus } from '@/lib/bulletSymbols'
import { ClockIcon, PencilLineIcon, CrossLargeIcon, AtIcon, ArrowUpIcon, PulseyAvatar } from '@/components/icons/PulseIcons'
import { IconButton } from '@/components/ui/IconButton'
import type { BulletItem as BulletItemType } from '@/lib/types'

interface DaySection {
  date: string
  displayDate: string
  items: Partial<BulletItemType>[]
  isToday: boolean
}

export function TimelineDashboard() {
  const { user, signOut } = useAuth()
  const [days, setDays] = useState<DaySection[]>([])
  const [loading, setLoading] = useState(true)
  const [showCancelled, setShowCancelled] = useState<{ [key: string]: boolean }>({})
  const [focusMode, setFocusMode] = useState(false)
  const [showPrediction, setShowPrediction] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const todayRef = useRef<HTMLDivElement>(null)

  // Load multiple days of bullet items
  useEffect(() => {
    if (!user) return

    const loadTimelineItems = async () => {
      const today = new Date()
      const daysToLoad = focusMode ? 1 : 3 // Load 3 days in timeline mode, 1 in focus mode
      const dayPromises = []

      for (let i = 0; i < daysToLoad; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        dayPromises.push(
          supabase
            .from('daily_logs')
            .select(`
              id,
              date,
              bullet_items (*)
            `)
            .eq('user_id', user.id)
            .eq('date', dateStr)
            .single()
            .then(({ data, error }) => {
              if (error || !data) {
                return {
                  date: dateStr,
                  displayDate: formatDisplayDate(date, i === 0),
                  items: [],
                  isToday: i === 0
                }
              }
              
              return {
                date: dateStr,
                displayDate: formatDisplayDate(date, i === 0),
                items: data.bullet_items || [],
                isToday: i === 0
              }
            })
        )
      }

      const results = await Promise.all(dayPromises)
      setDays(results)
      setLoading(false)

      // Scroll to today section after loading
      setTimeout(() => {
        if (todayRef.current) {
          todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
      }, 100)
    }

    loadTimelineItems()
  }, [user, focusMode])

  const formatDisplayDate = (date: Date, isToday: boolean) => {
    if (isToday) return 'Today'
    
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
    
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }

  const handleItemAdded = (item: Partial<BulletItemType>) => {
    // Add to today's items
    setDays(prev => {
      const newDays = [...prev]
      const todayIndex = newDays.findIndex(d => d.isToday)
      if (todayIndex >= 0) {
        newDays[todayIndex].items.push(item)
      }
      return newDays
    })
  }

  const handleItemUpdated = (itemId: string, updates: Partial<BulletItemType>) => {
    setDays(prev => {
      const newDays = [...prev]
      for (const day of newDays) {
        const itemIndex = day.items.findIndex(item => item.id === itemId)
        if (itemIndex >= 0) {
          day.items[itemIndex] = { ...day.items[itemIndex], ...updates }
          break
        }
      }
      return newDays
    })
  }

  const handleStateChange = async (item: Partial<BulletItemType>, newState: { type?: BulletItemType['bullet_type'], status?: BulletItemType['status'] }) => {
    if (!item.id) return

    const originalType = item.bullet_type
    const newType = newState.type || item.bullet_type
    const newStatus = newState.status || item.status
    const newSymbol = newState.status ? getSymbolForStatus(newType, newStatus) : getDefaultSymbol(newType)

    // Update UI immediately
    handleItemUpdated(item.id, {
      bullet_type: newType,
      status: newStatus,
      symbol: newSymbol
    })

    // Save changes to database
    try {
      await supabase
        .from('bullet_items')
        .update({ 
          bullet_type: newType,
          status: newStatus,
          symbol: newSymbol
        })
        .eq('id', item.id)

      // Save correction for AI learning (only for type changes)
      if (newState.type && newState.type !== originalType) {
        await supabase
          .from('ai_corrections')
          .insert({
            user_id: user?.id,
            bullet_item_id: item.id,
            original_text: item.text,
            ai_predicted_type: originalType,
            user_corrected_type: newState.type,
          })
      }
    } catch (error) {
      console.error('Failed to save state change:', error)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const toggleFocusMode = () => {
    setFocusMode(!focusMode)
  }

  // Keyboard shortcut for focus mode
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'f' && e.metaKey) {
        e.preventDefault()
        toggleFocusMode()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  return (
    <div className="min-h-screen bg-white flex">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[rgba(0,0,0,0.07)] z-10">
          <div className="flex items-center justify-between px-20 py-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">Pulse</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFocusMode(false)}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    !focusMode 
                      ? 'bg-black text-white' 
                      : 'text-[rgba(0,0,0,0.44)] hover:text-[rgba(0,0,0,0.88)]'
                  }`}
                >
                  Timeline
                </button>
                <button
                  onClick={() => setFocusMode(true)}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    focusMode 
                      ? 'bg-black text-white' 
                      : 'text-[rgba(0,0,0,0.44)] hover:text-[rgba(0,0,0,0.88)]'
                  }`}
                >
                  Focus
                </button>
              </div>
            </div>
            <span className="text-sm text-[rgba(0,0,0,0.44)]">⌘F to toggle focus</span>
          </div>
        </div>

        {/* Timeline Content */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto pb-32"
          style={{ paddingBottom: '120px' }} // Space for fixed input
        >
          <div className="max-w-[720px] mx-auto px-20 py-10">
            {days.map((day, dayIndex) => (
              <div 
                key={day.date} 
                ref={day.isToday ? todayRef : null}
                className={`mb-12 ${
                  !day.isToday && !focusMode ? 'opacity-90' : ''
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center gap-2 mb-6">
                  <span className={`text-[28px] leading-8 font-semibold tracking-[-0.336px] ${
                    day.isToday ? 'text-[rgba(0,0,0,0.88)]' : 'text-[rgba(0,0,0,0.64)]'
                  }`}>
                    {day.displayDate}
                  </span>
                  <span className="text-[28px] leading-8 font-semibold text-[rgba(0,0,0,0.2)] tracking-[-0.336px]">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                {/* Day's Items */}
                <div className="flex flex-col gap-1">
                  {day.items.filter(item => item.status !== 'cancelled').map((item, index) => (
                    <BulletItemWithMenu 
                      key={item.id || `${day.date}-${index}`} 
                      item={item}
                      isLast={false}
                      onStateChange={(newState) => handleStateChange(item, newState)}
                    />
                  ))}
                  
                  {/* Show input only for today */}
                  {day.isToday && (
                    <div className="flex gap-4 items-start w-[720px] mt-2">
                      <div className="flex flex-col items-center min-h-10 w-5">
                        <div className="w-5 h-5 flex items-center justify-center">
                          {!showPrediction && (
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <circle cx="10" cy="10" r="7.25" stroke="black" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="3 3"/>
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 pb-4 pt-0">
                        <RapidLogger 
                          onItemAdded={handleItemAdded}
                          onItemUpdated={handleItemUpdated}
                          onPredictionChange={(hasPrediction) => setShowPrediction(hasPrediction)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Cancelled Items Section */}
                {day.items.filter(item => item.status === 'cancelled').length > 0 && (
                  <div className="mt-6">
                    <button 
                      onClick={() => setShowCancelled(prev => ({
                        ...prev,
                        [day.date]: !prev[day.date]
                      }))}
                      className="text-base leading-5 font-normal text-[rgba(0,0,0,0.2)] tracking-[-0.192px] hover:text-[rgba(0,0,0,0.4)] transition-colors"
                    >
                      {showCancelled[day.date] ? 'Hide' : 'Show'} {day.items.filter(item => item.status === 'cancelled').length} cancelled
                    </button>
                    
                    {showCancelled[day.date] && (
                      <div className="mt-3 flex flex-col gap-1">
                        {day.items.filter(item => item.status === 'cancelled').map((item, index) => (
                          <BulletItemWithMenu 
                            key={`cancelled-${item.id || index}`}
                            item={item}
                            isLast={false}
                            onStateChange={(newState) => handleStateChange(item, newState)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Floating Return to Today (shown when scrolled away) */}
        <button
          onClick={() => todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg hover:bg-[rgba(0,0,0,0.88)] transition-colors hidden"
        >
          ↓ Return to Today
        </button>
      </div>

      {/* Pulsey Chat Sidebar */}
      <div className="bg-[#fcfcfc] border-l border-[rgba(0,0,0,0.07)] w-72 flex flex-col p-2 gap-8">
        {/* Header with buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IconButton size={20}>
              <ClockIcon className="text-[rgba(0,0,0,0.44)]" size={20} />
            </IconButton>
            <IconButton size={20}>
              <PencilLineIcon className="text-[rgba(0,0,0,0.44)]" size={20} />
            </IconButton>
          </div>
          <div className="flex items-center gap-3">
            <IconButton size={20}>
              <CrossLargeIcon className="text-[rgba(0,0,0,0.44)]" size={20} />
            </IconButton>
          </div>
        </div>

        {/* Chat Messages Container */}
        <div className="flex-1 flex flex-col justify-end gap-6 px-2">
          {/* Pulsey message */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <PulseyAvatar size={20} />
              <span className="text-xs font-medium text-[rgba(0,0,0,0.44)] leading-[17px]">
                Pulsey
              </span>
            </div>
            <p className="text-xs font-normal text-[#5e5e5e] leading-[17px]">
              {focusMode 
                ? "Focus mode is on. You're only seeing today's entries."
                : "Timeline view shows your recent days. Scroll up to see the past."}
            </p>
          </div>
        </div>

        {/* Input Area */}
        <div className="w-full">
          <div className="backdrop-blur-[6px] bg-[rgba(0,0,0,0.03)] rounded-2xl p-3 h-24 flex flex-col gap-4">
            <div className="flex-1 flex items-start">
              <span className="text-base font-medium text-[rgba(0,0,0,0.32)] leading-[22px] tracking-[-0.384px]">
                Ask me anything...
              </span>
            </div>
            <div className="flex items-end justify-between">
              <IconButton size={20}>
                <AtIcon className="text-[rgba(0,0,0,0.32)]" size={20} />
              </IconButton>
              <button className="w-6 h-6 bg-[rgba(0,0,0,0.34)] opacity-40 hover:opacity-60 rounded-full flex items-center justify-center transition-opacity cursor-pointer">
                <ArrowUpIcon className="text-white" size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}