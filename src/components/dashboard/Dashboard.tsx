'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { RapidLogger } from '@/components/bullet-journal/RapidLogger'
import { BulletItemWithMenu } from '@/components/bullet-journal/BulletItemWithMenu'
import { getDefaultSymbol, getSymbolForStatus } from '@/lib/bulletSymbols'
import { ClockIcon, PencilLineIcon, CrossLargeIcon, AtIcon, ArrowUpIcon, PulseyAvatar } from '@/components/icons/PulseIcons'
import { IconButton } from '@/components/ui/IconButton'
import type { BulletItem as BulletItemType } from '@/lib/types'

export function Dashboard() {
  const { user, signOut } = useAuth()
  const [bulletItems, setBulletItems] = useState<Partial<BulletItemType>[]>([])
  const [loading, setLoading] = useState(true)
  const [showCancelled, setShowCancelled] = useState(false)
  const [showPrediction, setShowPrediction] = useState(false)

  // Load today's bullet items on mount
  useEffect(() => {
    if (!user) return

    const loadTodayItems = async () => {
      // Using supabase client directly
      const today = new Date().toISOString().split('T')[0]
      
      // First get today's daily log
      const { data: dailyLog, error: dailyLogError } = await supabase
        .from('daily_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

      if (dailyLogError || !dailyLog) {
        // No daily log exists yet, so no items
        setBulletItems([])
        setLoading(false)
        return
      }

      // Get bullet items for today's daily log
      const { data, error } = await supabase
        .from('bullet_items')
        .select('*')
        .eq('daily_log_id', dailyLog.id)
        .order('order_index', { ascending: true })

      if (error) {
        console.error('Failed to load bullet items:', error)
      } else {
        setBulletItems(data || [])
      }
      setLoading(false)
    }

    loadTodayItems()
  }, [user])

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center py-20 px-20">
        <div className="w-[720px] max-w-full">
          {/* Header */}
          <div className="flex items-center gap-2 mb-10">
            <span className="text-[28px] leading-8 font-semibold text-[rgba(0,0,0,0.88)] tracking-[-0.336px]">
              Today
            </span>
            <span className="text-[28px] leading-8 font-semibold text-[rgba(0,0,0,0.2)] tracking-[-0.336px]">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
            
          {/* Bullet Items Container */}
          <div className="flex flex-col gap-1">
            {/* Active Bullet Items */}
            {bulletItems.filter(item => item.status !== 'cancelled').map((item, index) => (
              <BulletItemWithMenu 
                key={item.id || index} 
                item={item}
                isLast={false}
                onStateChange={async ({ type, status }) => {
                  if (!item.id) return

                  const originalType = item.bullet_type
                  const newType = type || item.bullet_type
                  const newStatus = status || item.status
                  const newSymbol = status ? getSymbolForStatus(newType, newStatus) : getDefaultSymbol(newType)

                  // Update UI immediately
                  setBulletItems(prev => 
                    prev.map(prevItem => 
                      prevItem.id === item.id
                        ? { 
                            ...prevItem, 
                            bullet_type: newType,
                            status: newStatus,
                            symbol: newSymbol
                          }
                        : prevItem
                    )
                  )

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
                    if (type && type !== originalType) {
                      await supabase
                        .from('ai_corrections')
                        .insert({
                          user_id: user?.id,
                          bullet_item_id: item.id,
                          original_text: item.text,
                          ai_predicted_type: originalType,
                          user_corrected_type: type,
                        })
                    }
                  } catch (error) {
                    console.error('Failed to save state change:', error)
                  }
                }}
              />
            ))}
            
            {/* Inline Input */}
            <div className="flex gap-4 items-start w-[720px]">
              <div className="flex flex-col items-center min-h-10 w-5">
                <div className="w-5 h-5 flex items-center justify-center">
                  {!showPrediction && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="7.25" stroke="black" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="3 3"/>
                    </svg>
                  )}
                </div>
              </div>
              <div className="flex-1 pb-16 pt-0">
                <RapidLogger 
                onItemAdded={(item) => setBulletItems(prev => [...prev, item])}
                onItemUpdated={(itemId, updates) => {
                  setBulletItems(prev => prev.map(item => 
                    item.id === itemId ? { ...item, ...updates } : item
                  ))
                }}
                onPredictionChange={(hasPrediction) => setShowPrediction(hasPrediction)}
              />
              </div>
            </div>
          </div>
          
          {/* Cancelled Items Section */}
          {bulletItems.filter(item => item.status === 'cancelled').length > 0 && (
            <div className="mt-10">
              <button 
                onClick={() => setShowCancelled(!showCancelled)}
                className="text-base leading-5 font-normal text-[rgba(0,0,0,0.2)] tracking-[-0.192px] hover:text-[rgba(0,0,0,0.4)] transition-colors"
              >
                {showCancelled ? 'Hide' : 'Show'} {bulletItems.filter(item => item.status === 'cancelled').length} cancelled
              </button>
              
              {showCancelled && (
                <div className="mt-3 flex flex-col gap-1">
                  {bulletItems.filter(item => item.status === 'cancelled').map((item, index, arr) => (
                    <BulletItemWithMenu 
                      key={`cancelled-${item.id || index}`}
                      item={item}
                      isLast={index === arr.length - 1}
                      onStateChange={async ({ type, status }) => {
                        if (!item.id) return

                        const originalType = item.bullet_type
                        const newType = type || item.bullet_type
                        const newStatus = status || item.status
                        const newSymbol = status ? getSymbolForStatus(newType, newStatus) : getDefaultSymbol(newType)

                        // Update UI immediately
                        setBulletItems(prev => 
                          prev.map(prevItem => 
                            prevItem.id === item.id
                              ? { 
                                  ...prevItem, 
                                  bullet_type: newType,
                                  status: newStatus,
                                  symbol: newSymbol
                                }
                              : prevItem
                          )
                        )

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
                          if (type && type !== originalType) {
                            await supabase
                              .from('ai_corrections')
                              .insert({
                                user_id: user?.id,
                                bullet_item_id: item.id,
                                original_text: item.text,
                                ai_predicted_type: originalType,
                                user_corrected_type: type,
                              })
                          }
                        } catch (error) {
                          console.error('Failed to save state change:', error)
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
              A winglet is basically a vertical or angled extension at the end of an airplane's wing. its main job is to reduce something called "induced drag," which is a type of aerodynamic resistance that happens because of the way air flows around the wing tips.
            </p>
          </div>
          
          {/* Searching status */}
          <div className="flex items-center gap-2">
            <PulseyAvatar size={20} />
            <span className="text-xs font-medium text-[rgba(0,0,0,0.44)] leading-[17px]">
              searching
            </span>
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