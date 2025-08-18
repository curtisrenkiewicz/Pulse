'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { getUserDateString, getTodayInUserTimezone } from '@/lib/dateUtils'
import { TimezoneDetector } from '@/components/TimezoneDetector'
import { VanishingInput } from '@/components/bullet-journal/VanishingInput'
import { BulletItemWithMenu } from '@/components/bullet-journal/BulletItemWithMenu'
import { getDefaultSymbol, getSymbolForStatus } from '@/lib/bulletSymbols'
import { 
  ClockIcon, 
  PencilLineIcon, 
  CrossLargeIcon, 
  AtIcon, 
  ArrowUpIcon, 
  PulseyAvatar,
  SidebarIcon,
  FocusModeIcon,
  CircleDashedIcon
} from '@/components/icons/PulseIcons'
import { IconButton } from '@/components/ui/IconButton'
import type { BulletItem as BulletItemType } from '@/lib/types'

interface DaySection {
  date: string
  displayDate: string
  items: Partial<BulletItemType>[]
  isToday: boolean
}

export function TimelineRedesign() {
  const { user, userTimezone, signOut } = useAuth()
  const [days, setDays] = useState<DaySection[]>([])
  const [loading, setLoading] = useState(true)
  const [focusMode, setFocusMode] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [oldestLoadedDate, setOldestLoadedDate] = useState<string | null>(null)
  const [firstEntryDate, setFirstEntryDate] = useState<string | null>(null)
  const [reachedBeginning, setReachedBeginning] = useState(false)
  const [showTodayButton, setShowTodayButton] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const todayRef = useRef<HTMLDivElement>(null)

  // Fetch the user's first journal entry date
  useEffect(() => {
    if (!user || !userTimezone) return
    
    const fetchFirstEntryDate = async () => {
      // Query for the oldest bullet item
      const { data, error } = await supabase
        .from('bullet_items')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()
      
      if (data && !error) {
        // Store the date of the first entry in user's timezone
        const firstDate = getUserDateString(new Date(data.created_at), userTimezone)
        setFirstEntryDate(firstDate)
      }
    }
    
    fetchFirstEntryDate()
  }, [user, userTimezone])

  // Load multiple days of bullet items
  useEffect(() => {
    if (!user || !userTimezone) return

    const loadTimelineItems = async () => {
      const today = new Date()
      const daysToLoad = focusMode ? 1 : 14 // Load 14 days instead of 3
      const dayPromises = []

      for (let i = 0; i < daysToLoad; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = getUserDateString(date, userTimezone)
        
        dayPromises.push(
          supabase
            .from('daily_logs')
            .select(`
              id,
              date,
              bullet_items(*)
            `)
            .eq('user_id', user.id)
            .eq('date', dateStr)
            .maybeSingle()
            .then(({ data, error }) => {
              // Always create an entry for each day, even if empty
              return {
                date: dateStr,
                displayDate: formatDisplayDate(date, i === 0),
                items: data?.bullet_items || [],
                isToday: i === 0
              }
            })
        )
      }

      const results = await Promise.all(dayPromises)
      // Reverse to show oldest first (at top)
      const reversedResults = results.reverse()
      
      setDays(reversedResults)
      setLoading(false)
      
      // Set the oldest loaded date for infinite scroll
      if (reversedResults.length > 0) {
        setOldestLoadedDate(reversedResults[0].date)
      }

      // Scroll to bottom instantly (no animation) to show today's entries
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
        }
      }, 0)
    }

    loadTimelineItems()
  }, [user, userTimezone, focusMode])

  const formatDisplayDate = (date: Date, isToday: boolean) => {
    if (isToday) return 'Today'
    
    // Format as "Aug 14" for other days
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return formatted
  }

  const formatDatePart = (dateStr: string) => {
    // Parse the date string in local timezone to avoid conversion issues
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const handleItemAdded = async (text: string) => {
    if (!text.trim() || !user || !userTimezone) return

    // Create the item in the database first
    const today = getTodayInUserTimezone(userTimezone)
    
    // Get or create today's daily log
    let { data: dailyLog } = await supabase
      .from('daily_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    let logId = dailyLog?.id

    if (!logId) {
      const { data: newLog, error: newLogError } = await supabase
        .from('daily_logs')
        .insert({ user_id: user.id, date: today })
        .select('id')
        .single()
      
      if (newLogError) {
        console.error('Failed to create daily log:', newLogError)
        return
      }
      logId = newLog.id
    }

    // Categorize the text with AI
    const category = await categorizeWithAI(text)
    const symbol = getDefaultSymbol(category)

    // Create the bullet item
    const { data: newItem, error: itemError } = await supabase
      .from('bullet_items')
      .insert({
        daily_log_id: logId,
        text,
        bullet_type: category,
        symbol,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (itemError) {
      console.error('Failed to create item:', itemError)
      return
    }

    // Add to UI - check if today exists in days array
    setDays(prev => {
      const newDays = [...prev]
      let todayIndex = newDays.findIndex(d => d.isToday)
      
      // If today doesn't exist, create it
      if (todayIndex === -1) {
        const today = getTodayInUserTimezone(userTimezone)
        // Add to end since days are in chronological order (oldest first)
        newDays.push({
          date: today,
          displayDate: 'Today',
          items: [newItem],
          isToday: true
        })
      } else {
        // Add to existing today
        const exists = newDays[todayIndex].items.some(i => i.id === newItem.id)
        if (!exists) {
          newDays[todayIndex].items.push(newItem)
        }
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

  const categorizeWithAI = async (text: string): Promise<BulletItemType['bullet_type']> => {
    try {
      const response = await fetch('/api/ai/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, userId: user?.id })
      })
      
      if (!response.ok) {
        throw new Error('Failed to categorize')
      }
      
      const data = await response.json()
      return data.category || 'task'
    } catch (error) {
      console.error('AI categorization failed:', error)
      return 'task'
    }
  }

  const toggleFocusMode = () => {
    setFocusMode(!focusMode)
  }

  // Keyboard shortcut for focus mode
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger on 'f' key without modifiers (not Cmd+F or Ctrl+F)
      // Also ignore if user is typing in an input/textarea
      const isTyping = e.target instanceof HTMLInputElement || 
                      e.target instanceof HTMLTextAreaElement
      
      if (e.key === 'f' && !e.metaKey && !e.ctrlKey && !e.altKey && !isTyping) {
        e.preventDefault()
        toggleFocusMode()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  // Load more historical data when scrolling near top
  const loadMoreDays = async () => {
    if (loadingMore || !oldestLoadedDate || !user || !userTimezone || focusMode || reachedBeginning) return
    
    setLoadingMore(true)
    
    const oldestDate = new Date(oldestLoadedDate)
    const dayPromises = []
    let hitBoundary = false
    
    // Load up to 14 more days before the oldest loaded date
    for (let i = 1; i <= 14; i++) {
      const date = new Date(oldestDate)
      date.setDate(date.getDate() - i)
      const dateStr = getUserDateString(date, userTimezone)
      
      // Check if we've reached before the first entry date
      if (firstEntryDate && dateStr < firstEntryDate) {
        hitBoundary = true
        // Don't load days before the first entry
        continue
      }
      
      dayPromises.push(
        supabase
          .from('daily_logs')
          .select(`
            id,
            date,
            bullet_items(*)
          `)
          .eq('user_id', user.id)
          .eq('date', dateStr)
          .maybeSingle()
          .then(({ data, error }) => {
            return {
              date: dateStr,
              displayDate: formatDisplayDate(date, false),
              items: data?.bullet_items || [],
              isToday: false
            }
          })
      )
    }
    
    // Mark if we've reached the beginning
    if (hitBoundary || dayPromises.length === 0) {
      setReachedBeginning(true)
    }
    
    const results = await Promise.all(dayPromises)
    // Reverse to show oldest first
    const reversedResults = results.reverse()
    
    // Prepend to existing days
    setDays(prev => [...reversedResults, ...prev])
    
    // Update oldest loaded date
    if (reversedResults.length > 0) {
      setOldestLoadedDate(reversedResults[0].date)
    }
    
    setLoadingMore(false)
  }

  // Handle scrollbar visibility and infinite scroll
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    let scrollTimeout: NodeJS.Timeout

    const handleScroll = () => {
      // Scrollbar visibility
      scrollContainer.classList.add('is-scrolling')
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        scrollContainer.classList.remove('is-scrolling')
      }, 1000)
      
      // Check for infinite scroll trigger (within 200px of top)
      if (scrollContainer.scrollTop < 200 && !loadingMore && !focusMode) {
        loadMoreDays()
      }
      
      // Check if today is in view
      if (todayRef.current) {
        const todayRect = todayRef.current.getBoundingClientRect()
        const containerRect = scrollContainer.getBoundingClientRect()
        const isInView = todayRect.top >= containerRect.top && todayRect.bottom <= containerRect.bottom
        setShowTodayButton(!isInView)
      }
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [loadingMore, oldestLoadedDate, focusMode, reachedBeginning, userTimezone])
  
  // Scroll to today function
  const scrollToToday = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      <TimezoneDetector />
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header - 40px height, sticky */}
        <div className="sticky top-0 h-10 z-20 flex items-center justify-between px-3">
          <div className="flex items-center gap-3">
            <IconButton size={20}>
              <SidebarIcon className="text-[#ADADAD]" size={20} />
            </IconButton>
          </div>
          <IconButton 
            size={20} 
            onClick={toggleFocusMode}
            className={focusMode ? 'bg-black/5' : ''}
          >
            <FocusModeIcon className="text-[#ADADAD]" size={20} />
          </IconButton>
        </div>

        {/* Timeline Content with scroll */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto pb-40"
          style={{
            maskImage: 'linear-gradient(to bottom, black 0%, black calc(100% - 80px), transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black calc(100% - 80px), transparent 100%)'
          }}
        >
          <div className="max-w-[776px] mx-auto px-3 pt-10">
            {/* Loading indicator for infinite scroll */}
            {loadingMore && (
              <div className="text-center py-4 text-[rgba(0,0,0,0.4)]">
                Loading more days...
              </div>
            )}
            
            {/* Beginning of journey message */}
            {reachedBeginning && firstEntryDate && days.length > 0 && (
              <div className="mb-12 text-center">
                <div className="inline-block">
                  <div className="h-[1px] bg-[rgba(0,0,0,0.08)] w-32 mb-6"></div>
                  <p className="text-base text-[rgba(0,0,0,0.44)] mb-2">
                    This is where your journey began
                  </p>
                  <p className="text-sm text-[rgba(0,0,0,0.3)]">
                    {formatDatePart(firstEntryDate)}
                  </p>
                </div>
              </div>
            )}
            {days.map((day, dayIndex) => (
              <div 
                key={day.date}
                className="mb-12"
                ref={day.isToday ? todayRef : undefined}
              >
                {/* Day Header */}
                <div className="flex items-center gap-1 mb-6">
                  <span 
                    className="text-base font-semibold text-[rgba(0,0,0,0.88)]"
                    style={{ 
                      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                      fontSize: '16px',
                      lineHeight: '32px',
                      letterSpacing: '-0.012em'
                    }}
                  >
                    {day.displayDate}
                  </span>
                  {day.isToday && (
                    <span 
                      className="text-base font-semibold text-[rgba(0,0,0,0.2)]"
                      style={{ 
                        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                        fontSize: '16px',
                        lineHeight: '32px',
                        letterSpacing: '-0.012em'
                      }}
                    >
                      {formatDatePart(day.date)}
                    </span>
                  )}
                </div>

                {/* Day's Items */}
                <div className="flex flex-col gap-1">
                  {/* Show "No entries" if day has no items */}
                  {day.items.length === 0 && (
                    <div className="text-base text-[rgba(0,0,0,0.3)] pb-2">
                      No entries
                    </div>
                  )}
                  
                  {/* Active items */}
                  {day.items.filter(item => item.status !== 'cancelled').map((item, index) => {
                    const activeItems = day.items.filter(i => i.status !== 'cancelled')
                    const isLast = index === activeItems.length - 1 && !day.items.some(i => i.status === 'cancelled')
                    
                    return (
                      <div key={item.id || `${day.date}-${index}`} className="relative">
                        <BulletItemWithMenu 
                          item={item}
                          isLast={isLast}
                          onStateChange={(newState) => handleStateChange(item, newState)}
                        />
                        {/* Vertical line - connects to next item or cancelled section */}
                        {!isLast && (
                          <div 
                            className="absolute left-[10px] top-[20px] w-[1px] bg-[rgba(0,0,0,0.08)]"
                            style={{ height: 'calc(100% - 0px)' }}
                          />
                        )}
                      </div>
                    )
                  })}
                  
                  {/* Cancelled items as a single entry */}
                  {day.items.filter(item => item.status === 'cancelled').length > 0 && (
                    <div className="relative">
                      {/* Line from last active item to cancelled */}
                      {day.items.filter(i => i.status !== 'cancelled').length > 0 && (
                        <div 
                          className="absolute left-[10px] -top-[1px] w-[1px] h-[21px] bg-[rgba(0,0,0,0.08)]"
                        />
                      )}
                      <div className="flex gap-4 items-start w-[720px] min-h-10">
                        <div className="flex flex-col items-center min-h-10 w-5">
                          <div className="w-5 h-5 flex items-center justify-center">
                            <CircleDashedIcon size={20} />
                          </div>
                        </div>
                        <div className="flex-1 pb-2 pt-0">
                          <span className="text-base leading-5 font-normal text-[rgba(0,0,0,0.2)] tracking-[-0.192px]">
                            {day.items.filter(item => item.status === 'cancelled').length} cancelled
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Fixed bottom section with input and Today button */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-2 p-4">
          {/* Today button - always rendered but visibility controlled by animation */}
          <button
            onClick={scrollToToday}
            className="flex items-center bg-white border border-[rgba(0,0,0,0.07)] rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            style={{
              padding: '4px 6px 4px 10px',
              gap: '4px',
              height: '28px',
              boxShadow: '0px 2px 1px rgba(0, 0, 0, 0.02)',
              animation: showTodayButton ? 'slideUp 0.2s ease-out forwards' : 'slideDown 0.2s ease-out forwards',
              pointerEvents: showTodayButton ? 'auto' : 'none'
            }}
          >
            <span 
              className="text-[rgba(0,0,0,0.44)]"
              style={{
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                fontWeight: 500,
                fontSize: '14px',
                lineHeight: '20px',
                letterSpacing: '-0.024em'
              }}
            >
              Today
            </span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.1693 9.33301L8.0026 13.4997L3.83594 9.33301" stroke="#ADADAD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 13V2.5" stroke="#ADADAD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          {/* Input field */}
          <VanishingInput 
            onSubmit={handleItemAdded}
            placeholder="What's on your mind?"
          />
        </div>
      </div>

      {/* Pulsey Chat Sidebar */}
      <div className="bg-[#fcfcfc] border-l border-[rgba(0,0,0,0.07)] w-72 flex flex-col">
        {/* Header - 40px height to match main header */}
        <div className="h-10 flex items-center justify-between px-2 border-b border-[rgba(0,0,0,0.07)]">
          <div className="flex items-center gap-3">
            <IconButton size={20}>
              <ClockIcon className="text-[rgba(0,0,0,0.44)]" size={20} />
            </IconButton>
            <IconButton size={20}>
              <PencilLineIcon className="text-[rgba(0,0,0,0.44)]" size={20} />
            </IconButton>
          </div>
          <IconButton size={20}>
            <CrossLargeIcon className="text-[rgba(0,0,0,0.44)]" size={20} />
          </IconButton>
        </div>

        {/* Chat Messages Container */}
        <div className="flex-1 flex flex-col justify-end gap-6 p-4">
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
                : "Your timeline shows your recent days in chronological order."}
            </p>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-2">
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