'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { getUserDateString, getTodayInUserTimezone } from '@/lib/dateUtils'
import { format } from 'date-fns'
import { TimezoneDetector } from '@/components/TimezoneDetector'
import { VanishingInput, type VanishingInputRef } from '@/components/bullet-journal/VanishingInput'
import { BulletItemWithMenu } from '@/components/bullet-journal/BulletItemWithMenu'
import { FocusModeHeader } from '@/components/dashboard/FocusModeHeader'
import { PulseyInputDetection } from '@/components/dashboard/PulseyInputDetection'
import { PulseyPreviewModal } from '@/components/dashboard/PulseyPreviewModal'
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
  DotIcon,
  SignatureIcon
} from '@/components/icons/PulseIcons'
import { IconButton } from '@/components/ui/IconButton'
import type { BulletItem as BulletItemType } from '@/lib/types'

interface DaySection {
  date: string
  displayDate: string
  items: Partial<BulletItemType>[]
  isToday: boolean
}

interface TimelineRedesignProps {
  user?: any
  userTimezone?: string
}

export function TimelineRedesign({ user: propsUser, userTimezone: propsTimezone }: TimelineRedesignProps = {}) {
  const auth = useAuth()
  // Use props if provided, otherwise fall back to hook
  const user = propsUser || auth.user
  const userTimezone = propsTimezone || auth.userTimezone
  const { signOut } = auth
  const [days, setDays] = useState<DaySection[]>([])
  const [loading, setLoading] = useState(true)
  const [focusMode, setFocusMode] = useState(false)
  const [showChatSidebar, setShowChatSidebar] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [oldestLoadedDate, setOldestLoadedDate] = useState<string | null>(null)
  const [firstEntryDate, setFirstEntryDate] = useState<string | null>(null)
  const [reachedBeginning, setReachedBeginning] = useState(false)
  const [showTodayButton, setShowTodayButton] = useState(false)
  const [inputText, setInputText] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [hasDetection, setHasDetection] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const todayRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<VanishingInputRef>(null)
  const journeyBeganRef = useRef<HTMLDivElement>(null)
  const [journeyAnimated, setJourneyAnimated] = useState(false)

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
    console.log('Timeline useEffect - user:', user?.id, 'timezone:', userTimezone)
    // Wait for firstEntryDate to be fetched before loading timeline
    if (!user || !userTimezone) return

    const loadTimelineItems = async () => {
      console.log('Loading timeline items for user:', user.id)
      // Set loading true at the start
      setLoading(true)
      
      // First, let's test if we can connect to Supabase at all
      try {
        console.log('Testing Supabase connection...')
        console.log('Current user ID:', user.id)
        
        // Get the current session to ensure we have auth
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Current session:', session ? 'exists' : 'missing')
        
        // Try a simpler query first - just count rows without any filters
        const testQuery = supabase
          .from('user_profiles')
          .select('id', { count: 'exact', head: true })
        
        // Add timeout to the test query
        const testPromise = testQuery
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test query timeout after 3 seconds')), 3000)
        )
        
        const result = await Promise.race([
          testPromise,
          timeoutPromise
        ]).catch(err => ({ data: null, error: err }))
        
        console.log('Supabase test query result:', result)
        
        if (result.error) {
          console.error('Supabase test failed, skipping main queries:', result.error)
          setLoading(false)
          return
        }
      } catch (testErr) {
        console.error('Supabase connection test failed:', testErr)
        setLoading(false)
        return
      }
      
      // Add a small delay when switching modes to allow animations to start
      await new Promise(resolve => setTimeout(resolve, 75)) // Reduced from 150ms to 75ms
      
      const today = new Date()
      const daysToLoad = focusMode ? 1 : 14 // Load 14 days instead of 3
      const dayPromises = []
      let hitBoundary = false
      console.log('Starting to build queries for', daysToLoad, 'days')

      for (let i = 0; i < daysToLoad; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = getUserDateString(date, userTimezone)
        console.log(`Day ${i}: querying for date ${dateStr}`)
        
        // Skip days before firstEntryDate (same check as infinite scroll)
        if (firstEntryDate && dateStr < firstEntryDate) {
          console.log(`Skipping ${dateStr} as it's before first entry date ${firstEntryDate}`)
          hitBoundary = true
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
              console.log(`Query result for ${dateStr}:`, { data, error })
              if (error) {
                console.error('Error loading day:', dateStr, error)
              }
              // Always create an entry for each day, even if empty
              return {
                date: dateStr,
                displayDate: formatDisplayDate(date, i === 0),
                items: data?.bullet_items || [],
                isToday: i === 0
              }
            })
            .catch(err => {
              console.error(`Failed to query ${dateStr}:`, err)
              // Return empty day on error
              return {
                date: dateStr,
                displayDate: formatDisplayDate(date, i === 0),
                items: [],
                isToday: i === 0
              }
            })
        )
      }

      let results = []
      try {
        console.log('Executing Promise.all with', dayPromises.length, 'promises')
        
        // Add a timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000)
        )
        
        results = await Promise.race([
          Promise.all(dayPromises),
          timeoutPromise
        ])
        
        console.log('Fetched results:', results)
      } catch (error) {
        console.error('Error in Promise.all:', error)
        // Continue with empty results instead of returning
        results = Array(daysToLoad).fill(null).map((_, i) => {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          return {
            date: getUserDateString(date, userTimezone),
            displayDate: formatDisplayDate(date, i === 0),
            items: [],
            isToday: i === 0
          }
        })
        console.log('Using empty results due to error')
      }
      
      // Reverse to show oldest first (at top)
      const reversedResults = results.reverse()
      console.log('Reversed results:', reversedResults)
      console.log('Total days with data:', reversedResults.filter(d => d.items.length > 0).length)
      
      setDays(reversedResults)
      setLoading(false)
      console.log('Loading set to false, days state updated')
      
      // Set the oldest loaded date for infinite scroll
      if (reversedResults.length > 0) {
        setOldestLoadedDate(reversedResults[0].date)
      }
      
      // If we hit the boundary during initial load, mark as reached beginning
      if (hitBoundary) {
        setReachedBeginning(true)
      }
    }

    loadTimelineItems()
  }, [user, userTimezone, focusMode, firstEntryDate])
  
  // Scroll to today when exiting focus mode
  useEffect(() => {
    // Only scroll when exiting focus mode (going from true to false)
    if (!focusMode && days.length > 0) {
      // Use double requestAnimationFrame to ensure DOM is fully updated
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToToday()
        })
      })
    }
  }, [focusMode, days.length])
  
  // Auto-focus input when entering focus mode
  useEffect(() => {
    if (focusMode && !loading) {
      // Small delay to ensure the input is rendered and animations have started
      setTimeout(() => {
        inputRef.current?.focus()
      }, 150) // Reduced from 300ms to 150ms
    }
  }, [focusMode, loading])

  // Trigger animation when journey began section comes into view
  useEffect(() => {
    if (!journeyBeganRef.current || journeyAnimated) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !journeyAnimated) {
            setJourneyAnimated(true)
          }
        })
      },
      { threshold: 0.5 } // Trigger when 50% visible
    )

    observer.observe(journeyBeganRef.current)

    return () => {
      if (journeyBeganRef.current) {
        observer.unobserve(journeyBeganRef.current)
      }
    }
  }, [reachedBeginning, journeyAnimated])

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
    if (!text.trim() || !user || !userTimezone) {
      console.error('Missing required data:', { 
        text: text.trim(), 
        user: !!user, 
        userTimezone: !!userTimezone 
      })
      return
    }

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
        console.error('Failed to create daily log:', {
          error: newLogError,
          insertData: { user_id: user.id, date: today }
        })
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
        user_id: user.id,
        text,
        bullet_type: category,
        symbol,
        status: 'incomplete',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (itemError) {
      console.error('Failed to create item:', {
        error: itemError,
        insertData: {
          daily_log_id: logId,
          user_id: user.id,
          text,
          bullet_type: category,
          symbol,
          status: 'incomplete'
        }
      })
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
    
    // Scroll to bottom after adding item
    setTimeout(() => {
      scrollToToday()
    }, 100)
  }

  // Handle pre-parsed and categorized items from the preview modal
  const handleParsedItemAdded = async (text: string, bulletType: BulletItemType['bullet_type'], symbol: string, skipScroll?: boolean) => {
    if (!text.trim() || !user || !userTimezone) return

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

    // Create the bullet item with pre-determined type
    const { data: newItem, error: itemError } = await supabase
      .from('bullet_items')
      .insert({
        daily_log_id: logId,
        user_id: user.id,
        text,
        bullet_type: bulletType,
        symbol,
        status: 'incomplete',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (itemError) {
      console.error('Failed to create parsed item:', itemError)
      return
    }

    // Add to UI
    setDays(prev => {
      const newDays = [...prev]
      let todayIndex = newDays.findIndex(d => d.isToday)
      
      if (todayIndex === -1) {
        const today = getTodayInUserTimezone(userTimezone)
        newDays.push({
          date: today,
          displayDate: 'Today',
          items: [newItem],
          isToday: true
        })
      } else {
        const exists = newDays[todayIndex].items.some(i => i.id === newItem.id)
        if (!exists) {
          newDays[todayIndex].items.push(newItem)
        }
      }
      return newDays
    })
    
    // Scroll to bottom after adding item (unless skipped for batch operations)
    if (!skipScroll) {
      setTimeout(() => {
        scrollToToday()
      }, 100)
    }
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

  const [migrationInProgress, setMigrationInProgress] = useState(false)
  
  const handleMigration = async (item: Partial<BulletItemType>, destination: 'today' | 'next-day' | 'monthly-log' | 'future-log') => {
    if (!item.id || !user || !userTimezone || migrationInProgress) return
    
    setMigrationInProgress(true)
    
    try {
      // Mark original item as migrated
      await supabase
        .from('bullet_items')
        .update({ 
          status: 'migrated',
          symbol: '→'
        })
        .eq('id', item.id)
        
      // Update UI immediately
      handleItemUpdated(item.id, {
        status: 'migrated',
        symbol: '→'
      })
      
      // Create new item in destination
      let destinationLogId = null
      let destinationType = null
      
      if (destination === 'today') {
        // Get today's date in user timezone
        const todayStr = getUserDateString(getTodayInUserTimezone(userTimezone), userTimezone)
        
        // Find or create today's daily log
        let { data: dailyLog } = await supabase
          .from('daily_logs')
          .select('id')
          .eq('user_id', user.id)
          .eq('date', todayStr)
          .single()
          
        if (!dailyLog) {
          const { data: newLog } = await supabase
            .from('daily_logs')
            .insert({ user_id: user.id, date: todayStr })
            .select()
            .single()
          dailyLog = newLog
        }
        
        destinationLogId = dailyLog?.id
        destinationType = 'daily_log_id'
        
      } else if (destination === 'next-day') {
        // Get tomorrow's date in user timezone
        const today = getTodayInUserTimezone(userTimezone)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowStr = getUserDateString(tomorrow, userTimezone)
        
        // Find or create tomorrow's daily log
        let { data: dailyLog } = await supabase
          .from('daily_logs')
          .select('id')
          .eq('user_id', user.id)
          .eq('date', tomorrowStr)
          .single()
          
        if (!dailyLog) {
          const { data: newLog } = await supabase
            .from('daily_logs')
            .insert({ user_id: user.id, date: tomorrowStr })
            .select()
            .single()
          dailyLog = newLog
        }
        
        destinationLogId = dailyLog?.id
        destinationType = 'daily_log_id'
        
      } else if (destination === 'monthly-log') {
        // Get current month in user timezone
        const today = getTodayInUserTimezone(userTimezone)
        const month = today.getMonth() + 1 // JavaScript months are 0-indexed
        const year = today.getFullYear()
        
        // Find or create monthly log
        let { data: monthlyLog } = await supabase
          .from('monthly_logs')
          .select('id')
          .eq('user_id', user.id)
          .eq('month', month)
          .eq('year', year)
          .single()
          
        if (!monthlyLog) {
          const { data: newLog } = await supabase
            .from('monthly_logs')
            .insert({ user_id: user.id, month, year })
            .select()
            .single()
          monthlyLog = newLog
        }
        
        destinationLogId = monthlyLog?.id
        destinationType = 'monthly_log_id'
      }
      
      // Create the new item in the destination
      if (destinationLogId && destinationType) {
        const { data: newItem } = await supabase
          .from('bullet_items')
          .insert({
            user_id: user.id,
            [destinationType]: destinationLogId,
            text: item.text,
            bullet_type: 'task',
            status: 'incomplete',
            symbol: '○',
            order_index: 0
          })
          .select()
          .single()
        
        // Update the UI to show the new item in the destination
        if (newItem && (destination === 'today' || destination === 'next-day')) {
          let targetDateStr: string
          let targetDate: Date
          
          if (destination === 'today') {
            targetDate = getTodayInUserTimezone(userTimezone)
            targetDateStr = getUserDateString(targetDate, userTimezone)
          } else {
            targetDate = new Date(getTodayInUserTimezone(userTimezone))
            targetDate.setDate(targetDate.getDate() + 1)
            targetDateStr = getUserDateString(targetDate, userTimezone)
          }
          
          setDays(prev => {
            const newDays = [...prev]
            const targetIndex = newDays.findIndex(d => d.date === targetDateStr)
            
            if (targetIndex >= 0) {
              // Target date already exists in the timeline, add the item
              // Check if it doesn't already exist to avoid duplicates
              const itemExists = newDays[targetIndex].items.some(i => i.id === newItem.id)
              if (!itemExists) {
                newDays[targetIndex].items.unshift(newItem)
              }
            } else if (destination === 'next-day') {
              // Tomorrow doesn't exist yet, add it to the timeline
              const todayStr = getUserDateString(getTodayInUserTimezone(userTimezone), userTimezone)
              const todayIndex = newDays.findIndex(d => d.date === todayStr)
              
              if (todayIndex >= 0) {
                // Insert tomorrow right after today
                const tomorrowSection: DaySection = {
                  date: targetDateStr,
                  displayDate: format(targetDate, 'EEEE, MMMM d'),
                  items: [newItem],
                  isToday: false
                }
                newDays.splice(todayIndex + 1, 0, tomorrowSection)
              }
            }
            
            return newDays
          })
        }
      }
      
    } catch (error) {
      console.error('Migration failed:', error)
    } finally {
      setMigrationInProgress(false)
    }
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
      return data.type || 'task'
    } catch (error) {
      console.error('AI categorization failed:', error)
      return 'task'
    }
  }

  const toggleFocusMode = () => {
    // Set loading to trigger fade out
    setLoading(true)
    
    // Small delay before changing mode for smooth transition
    setTimeout(() => {
      const newFocusMode = !focusMode
      setFocusMode(newFocusMode)
      // Hide chat sidebar when entering focus mode, show when exiting
      setShowChatSidebar(!newFocusMode)
    }, 50) // Reduced from 100ms to 50ms
  }

  // Keyboard shortcuts for focus mode
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const isTyping = e.target instanceof HTMLInputElement || 
                      e.target instanceof HTMLTextAreaElement
      
      // Toggle focus mode with 'f' key (without modifiers)
      if (e.key === 'f' && !e.metaKey && !e.ctrlKey && !e.altKey && !isTyping) {
        e.preventDefault()
        toggleFocusMode()
      }
      
      // Exit focus mode with ESC key (only when focus mode is active)
      if (e.key === 'Escape' && focusMode && !isTyping) {
        e.preventDefault()
        setLoading(true) // Trigger fade out
        setTimeout(() => {
          setFocusMode(false)
          setShowChatSidebar(true) // Show chat sidebar when exiting focus mode
        }, 50) // Reduced from 100ms to 50ms
      }
      
      // Preview multi-item parsing with Cmd+P
      if (e.key === 'p' && e.metaKey && !e.shiftKey && !isTyping && inputText) {
        e.preventDefault()
        setShowPreview(true)
      }
      
      // Toggle Pulsey chat with Cmd+J
      if (e.key === 'j' && e.metaKey && !isTyping) {
        e.preventDefault()
        setShowChatSidebar(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [focusMode, inputText])

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
      
      // Check if ANY part of today section is visible (accounting for input area)
      if (todayRef.current) {
        const todayRect = todayRef.current.getBoundingClientRect()
        const containerRect = scrollContainer.getBoundingClientRect()
        // Check if there's any intersection between today section and effective viewport (minus ~120px for input area)
        const isAnyPartVisible = todayRect.bottom > containerRect.top && todayRect.top < containerRect.bottom - 120
        setShowTodayButton(!isAnyPartVisible)
      }
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [loadingMore, oldestLoadedDate, focusMode, reachedBeginning, userTimezone])
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        // Also check if the click is on the menu button itself
        const menuButton = document.querySelector('[data-menu-button]')
        if (menuButton && !menuButton.contains(event.target as Node)) {
          setShowMenu(false)
        }
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])
  
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
        {focusMode ? (
          <FocusModeHeader onExit={() => {
            setLoading(true)
            setTimeout(() => {
              setFocusMode(false)
              setShowChatSidebar(true)
            }, 100)
          }} />
        ) : (
          <div className="sticky top-0 h-10 z-20 flex items-center justify-between px-3">
            <div className="flex items-center gap-3 relative">
              <IconButton 
                size={20}
                onClick={() => setShowMenu(!showMenu)}
                className={showMenu ? 'bg-black/5' : ''}
                data-menu-button
              >
                <svg 
                  width={20} 
                  height={20} 
                  viewBox="0 0 20 20" 
                  fill="none" 
                  className="text-[#ADADAD]"
                >
                  <path 
                    d="M2.29297 6.45801C2.29297 5.0773 3.41226 3.95801 4.79297 3.95801H15.2096C16.5904 3.95801 17.7096 5.0773 17.7096 6.45801V13.5413C17.7096 14.9221 16.5904 16.0413 15.2096 16.0413H4.79297C3.41226 16.0413 2.29297 14.9221 2.29297 13.5413V6.45801Z" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d={showMenu 
                      ? "M6.875 4.16602V9.99935V15.8327" 
                      : "M5.875 7.16699V10.0003V12.8337"
                    }
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{
                      transition: 'all 0.2s ease-in-out',
                    }}
                  />
                </svg>
              </IconButton>
              
              {/* Simple Menu Dropdown */}
              {showMenu && (
                <div 
                  ref={menuRef}
                  className="absolute top-8 left-0 mt-1 bg-white border border-[rgba(0,0,0,0.07)] rounded-lg shadow-lg py-1 min-w-[160px]"
                  style={{
                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <button
                    onClick={() => {
                      signOut()
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-[#666666] hover:bg-gray-50 transition-colors"
                    style={{
                      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                      fontWeight: 500
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
            <IconButton 
              size={20} 
              onClick={toggleFocusMode}
              className={focusMode ? 'bg-black/5' : ''}
            >
              <FocusModeIcon className="text-[#ADADAD]" size={20} />
            </IconButton>
          </div>
        )}

        {/* Timeline Content with scroll and fade transition */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto pb-40 transition-opacity duration-200"
          style={{
            maskImage: 'linear-gradient(to bottom, black 0%, black calc(100% - 80px), transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black calc(100% - 80px), transparent 100%)',
            opacity: loading ? 0 : 1
          }}
        >
          <div className="max-w-[776px] mx-auto px-3 pt-10 flex flex-col gap-6">
            {/* Loading indicator for infinite scroll */}
            {loadingMore && (
              <div className="text-center py-4 text-[rgba(0,0,0,0.4)]">
                Loading more days...
              </div>
            )}
            
            {/* Beginning of journey message - only show when not in focus mode and showing multiple days */}
            {!focusMode && days.length > 1 && reachedBeginning && firstEntryDate && (
              <div ref={journeyBeganRef} className="flex flex-col items-center gap-4 pb-10">
                <div className="relative w-9 h-9">
                  <SignatureIcon 
                    className={`text-[rgba(0,0,0,0.32)] ${journeyAnimated ? 'animate-draw' : ''}`} 
                    size={36} 
                  />
                </div>
                <div className={`flex flex-col items-center gap-1 ${journeyAnimated ? 'animate-fade-in-delayed' : 'opacity-0'}`}>
                  <p className="text-xs font-medium text-[rgba(0,0,0,0.32)] tracking-[0.36px] leading-[17px]">
                    {formatDatePart(firstEntryDate)}
                  </p>
                  <p className="text-base font-normal text-[rgba(0,0,0,0.64)] tracking-[-0.192px] leading-5">
                    This is where your journey began
                  </p>
                </div>
              </div>
            )}
            {days.map((day, dayIndex) => (
              <div 
                key={day.date}
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
                    // Last item should NOT have a line if there are no cancelled items after it
                    const isLast = index === activeItems.length - 1 && !day.items.some(i => i.status === 'cancelled')
                    
                    return (
                      <div key={item.id || `${day.date}-${index}`} className="relative">
                        <BulletItemWithMenu 
                          item={item}
                          isLast={isLast}
                          onStateChange={(newState) => handleStateChange(item, newState)}
                          onMigrate={(destination) => handleMigration(item, destination)}
                        />
                      </div>
                    )
                  })}
                  
                  {/* Cancelled items as a single entry */}
                  {day.items.filter(item => item.status === 'cancelled').length > 0 && (
                    <div className="flex gap-4 items-start w-[720px]">
                      <div className="w-5 h-5 flex items-center justify-center">
                        <DotIcon size={16} />
                      </div>
                      <div className="h-5 flex items-center">
                        <span className="text-base leading-5 font-normal text-[#ADADAD] tracking-[-0.192px]">
                          {day.items.filter(item => item.status === 'cancelled').length} cancelled
                        </span>
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
          
          {/* Pulsey detection UI - shows above input when multi-item detected */}
          {inputText && (
            <PulseyInputDetection 
              text={inputText}
              onPreview={() => setShowPreview(true)}
              onDetectionChange={(hasDetection) => setHasDetection(hasDetection)}
            />
          )}
          
          {/* Input field */}
          <VanishingInput 
            ref={inputRef}
            onSubmit={async (text) => {
              // If detection is active, parse and submit multiple items
              if (hasDetection) {
                try {
                  // Parse the text into multiple items
                  const response = await fetch('/api/ai/parse-multi-items', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, userId: user?.id })
                  })
                  
                  if (response.ok) {
                    const { items } = await response.json()
                    // Add each parsed item with its determined type (skip scroll for all but last)
                    for (let i = 0; i < items.length; i++) {
                      const item = items[i]
                      const isLast = i === items.length - 1
                      await handleParsedItemAdded(item.text, item.bullet_type, item.symbol, !isLast)
                    }
                  } else {
                    // Fallback to single item if parsing fails
                    await handleItemAdded(text)
                  }
                } catch (error) {
                  console.error('Failed to parse multi-items:', error)
                  // Fallback to single item
                  await handleItemAdded(text)
                }
              } else {
                // Single item submission
                await handleItemAdded(text)
              }
              setInputText('') // Clear detection UI after submission
              setHasDetection(false) // Reset detection state
            }}
            onTextChange={setInputText}
            placeholder="What's on your mind?"
          />
        </div>
      </div>

      {/* Pulsey Chat Sidebar with slide transition */}
      <div 
        className={`bg-[#fcfcfc] border-l border-[rgba(0,0,0,0.07)] w-[344px] flex flex-col transition-all duration-300 ease-in-out ${
          showChatSidebar ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ 
          position: 'relative',
          marginRight: showChatSidebar ? '0' : '-344px' // -344px is negative width of sidebar
        }}>
        {/* Header - 40px height, no bottom border */}
        <div className="h-10 flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <IconButton size={20}>
              <ClockIcon className="text-[rgba(0,0,0,0.44)]" size={20} />
            </IconButton>
            <IconButton size={20}>
              <PencilLineIcon className="text-[rgba(0,0,0,0.44)]" size={20} />
            </IconButton>
          </div>
          <IconButton 
            size={20}
            onClick={() => setShowChatSidebar(false)}
          >
            <CrossLargeIcon className="text-[rgba(0,0,0,0.44)]" size={20} />
          </IconButton>
        </div>

        {/* Chat Messages Container */}
        <div className="flex-1 flex flex-col justify-end gap-6 pb-4 px-4">
          {/* User message */}
          <div className="flex flex-col gap-2 pl-16">
            <div className="bg-[rgba(0,0,0,0.04)] rounded-2xl px-3.5 py-1.5">
              <p className="text-sm font-normal text-[#5e5e5e] leading-[21px]">
                It's a good idea right? Idk it is something I've been thinking about for Scout
              </p>
            </div>
          </div>
          
          {/* AI message */}
          <div className="flex flex-col gap-2 px-1">
            <div className="flex items-center gap-2 py-0.5">
              <PulseyAvatar size={20} />
              <span className="text-xs font-medium text-[rgba(0,0,0,0.44)] leading-[17px] tracking-[0.36px]">
                Pulsey
              </span>
            </div>
            <div className="px-1">
              <p className="text-sm font-normal text-[#5e5e5e] leading-[21px] mb-2">
                Yes—strong idea for Scout. The "chief-of-staff" entry point lowers friction, hides agent sprawl, and lets you mix search, knowledge, and specialized skills with a single ask.
              </p>
              <p className="text-sm font-normal text-[#5e5e5e] leading-[21px] mb-2">
                What makes it compelling:
              </p>
              <ul className="list-disc ml-5 mb-2">
                <li className="text-sm font-normal text-[#5e5e5e] leading-[21px] mb-2">
                  One channel to rule them all: email or tag-in, routed automatically
                </li>
                <li className="text-sm font-normal text-[#5e5e5e] leading-[21px] mb-2">
                  Flexible knowledge hubs to control context and sources per use case
                </li>
                <li className="text-sm font-normal text-[#5e5e5e] leading-[21px]">
                  Summarized, actionable replies instead of raw tool output
                </li>
              </ul>
              <p className="text-sm font-normal text-[#5e5e5e] leading-[21px] mb-2">
                Watchouts
              </p>
              <ul className="list-disc ml-5">
                <li className="text-sm font-normal text-[#5e5e5e] leading-[21px] mb-2">
                  Orchestration costs: routing accuracy, timeouts, retries, and latency budgets
                </li>
                <li className="text-sm font-normal text-[#5e5e5e] leading-[21px] mb-2">
                  Permissions across hubs and integrations
                </li>
                <li className="text-sm font-normal text-[#5e5e5e] leading-[21px]">
                  Observability: traces, audits, and explanations for "why this answer"
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-2">
          <div className="bg-white border border-[rgba(0,0,0,0.1)] shadow-[0px_2px_2px_0px_rgba(0,0,0,0.04)] rounded-2xl p-3 h-[108px] min-h-[108px] max-h-[304px] flex flex-col justify-between">
            <div className="flex-1 flex items-start px-1 pb-4">
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
      
      {/* Floating Pulsey Avatar with fade transition */}
      <button
        onClick={() => setShowChatSidebar(true)}
        className={`fixed bottom-6 right-6 cursor-pointer transition-all duration-300 ${
          showChatSidebar ? 'opacity-0 pointer-events-none scale-50' : 'opacity-60 hover:opacity-100 scale-100'
        }`}
        style={{ zIndex: 30 }}
      >
        <PulseyAvatar size={40} />
      </button>
      
      {/* Preview Modal */}
      <PulseyPreviewModal
        text={inputText}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onConfirm={async (items) => {
          // Add all items to the timeline with their pre-determined types (skip scroll for all but last)
          for (let i = 0; i < items.length; i++) {
            const item = items[i]
            const isLast = i === items.length - 1
            await handleParsedItemAdded(item.text, item.bullet_type, item.symbol, !isLast)
          }
          // Clear the input and detection UI
          setInputText('')
          inputRef.current?.clear()
          inputRef.current?.focus()
        }}
      />
    </div>
  )
}