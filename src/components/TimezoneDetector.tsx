'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export function TimezoneDetector() {
  const { userTimezone, detectTimezone, updateTimezone } = useAuth()
  const [showNotification, setShowNotification] = useState(false)
  const [currentBrowserTimezone, setCurrentBrowserTimezone] = useState<string>('')

  useEffect(() => {
    const browserTz = detectTimezone()
    setCurrentBrowserTimezone(browserTz)
    
    // Check if browser timezone differs from saved timezone
    if (userTimezone && userTimezone !== 'UTC' && browserTz !== userTimezone) {
      setShowNotification(true)
    }
  }, [userTimezone, detectTimezone])

  const handleUpdateTimezone = async () => {
    await updateTimezone(currentBrowserTimezone)
    setShowNotification(false)
  }

  const handleDismiss = () => {
    setShowNotification(false)
  }

  if (!showNotification) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white border border-[rgba(0,0,0,0.07)] rounded-lg shadow-lg p-4 max-w-md">
      <p className="text-sm text-[rgba(0,0,0,0.88)] mb-3">
        You appear to be in <span className="font-medium">{currentBrowserTimezone}</span>. 
        Update your timezone settings?
      </p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={handleDismiss}
          className="px-3 py-1.5 text-sm text-[rgba(0,0,0,0.44)] hover:text-[rgba(0,0,0,0.66)] transition-colors"
        >
          Keep {userTimezone}
        </button>
        <button
          onClick={handleUpdateTimezone}
          className="px-3 py-1.5 text-sm bg-black text-white rounded-md hover:bg-black/80 transition-colors"
        >
          Update to {currentBrowserTimezone}
        </button>
      </div>
    </div>
  )
}